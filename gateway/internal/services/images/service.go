package images

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/safina57/animoji/gateway/internal/cache"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/internal/dto"
	"github.com/safina57/animoji/gateway/internal/jobs"
	"github.com/safina57/animoji/gateway/internal/messaging"
	"github.com/safina57/animoji/gateway/internal/models"
	"github.com/safina57/animoji/gateway/internal/repository"
	"github.com/safina57/animoji/gateway/internal/services/storage"
	"github.com/safina57/animoji/gateway/internal/services/thumbnail"
	"github.com/safina57/animoji/gateway/pkg/logger"
)

var (
	ErrNotFound   = errors.New("not found")
	ErrForbidden  = errors.New("forbidden")
	ErrBadRequest = errors.New("bad request")
	ErrConflict   = errors.New("conflict")
)

// ImageService handles business logic for image operations.
type ImageService struct {
	repo        *repository.Repository
	storageSvc  *storage.MinIOService
	redisClient *cache.RedisClient
	natsClient  *messaging.NatsClient
}

// NewImageService creates a new ImageService with injected dependencies.
func NewImageService(
	repo *repository.Repository,
	storageSvc *storage.MinIOService,
	redisClient *cache.RedisClient,
	natsClient *messaging.NatsClient,
) *ImageService {
	return &ImageService{
		repo:        repo,
		storageSvc:  storageSvc,
		redisClient: redisClient,
		natsClient:  natsClient,
	}
}

// SubmitJob uploads the original image, caches job metadata, and publishes to NATS.
// Returns the new job ID.
func (s *ImageService) SubmitJob(
	ctx context.Context,
	userID uuid.UUID,
	imageData []byte,
	ext, mimeType, prompt string,
	width, height int,
) (string, error) {
	jobID := uuid.New().String()

	inputKey, err := s.storageSvc.UploadTmpOriginal(ctx, jobID, imageData, ext, mimeType)
	if err != nil {
		return "", fmt.Errorf("upload original: %w", err)
	}

	metadata := &cache.JobMetadata{
		JobID:         jobID,
		UserID:        userID,
		Prompts:       []string{prompt},
		OriginalKey:   inputKey,
		OriginalExt:   ext,
		GeneratedKeys: []string{},
		Width:         width,
		Height:        height,
		IterationNum:  0,
		CreatedAt:     time.Now(),
	}
	if cacheErr := s.redisClient.SetJobMetadata(ctx, jobID, metadata); cacheErr != nil {
		logger.Error().Err(cacheErr).Str("job_id", jobID).Msg("Failed to cache job metadata in Redis")
	}

	message := jobs.ImageJobMessage{
		JobID:        jobID,
		InputKey:     inputKey,
		Prompt:       prompt,
		Width:        width,
		Height:       height,
		MIMEType:     mimeType,
		IterationNum: 0,
	}
	payload, err := json.Marshal(message)
	if err != nil {
		return "", fmt.Errorf("marshal NATS message: %w", err)
	}

	if err := s.natsClient.Publish(constants.NatsSubjectGenerate, payload); err != nil {
		return "", fmt.Errorf("publish to NATS: %w", err)
	}

	logger.Info().
		Str("job_id", jobID).
		Str("user_id", userID.String()).
		Str("prompt", prompt).
		Str("input_key", inputKey).
		Int("width", width).
		Int("height", height).
		Str("mime_type", mimeType).
		Msg("Image job submitted successfully")

	return jobID, nil
}

// RefineJob appends a refinement prompt and re-queues the job.
// Returns the new iteration number.
func (s *ImageService) RefineJob(
	ctx context.Context,
	userID uuid.UUID,
	jobID, prompt string,
) (int, error) {
	metadata, err := s.redisClient.GetJobMetadata(ctx, jobID)
	if err != nil {
		return 0, fmt.Errorf("%w: %v", ErrNotFound, err)
	}

	if metadata.UserID != userID {
		return 0, ErrForbidden
	}

	if len(metadata.GeneratedKeys) == 0 {
		return 0, fmt.Errorf("%w: job not completed yet", ErrBadRequest)
	}

	metadata.Prompts = append(metadata.Prompts, prompt)
	metadata.IterationNum++
	combinedPrompt := strings.Join(metadata.Prompts, ". ")

	if cacheErr := s.redisClient.SetJobMetadata(ctx, jobID, metadata); cacheErr != nil {
		return 0, fmt.Errorf("update job metadata: %w", cacheErr)
	}

	message := jobs.ImageJobMessage{
		JobID:              jobID,
		InputKey:           metadata.OriginalKey,
		Prompt:             combinedPrompt,
		Width:              metadata.Width,
		Height:             metadata.Height,
		MIMEType:           "image/png",
		IterationNum:       metadata.IterationNum,
		PreviousResponseID: metadata.LastResponseID,
	}
	payload, err := json.Marshal(message)
	if err != nil {
		return 0, fmt.Errorf("marshal NATS message: %w", err)
	}

	if err := s.natsClient.Publish(constants.NatsSubjectGenerate, payload); err != nil {
		return 0, fmt.Errorf("publish refinement to NATS: %w", err)
	}

	logger.Info().
		Str("job_id", jobID).
		Str("user_id", userID.String()).
		Int("iteration_num", metadata.IterationNum).
		Str("refinement_prompt", prompt).
		Msg("Refinement submitted successfully")

	return metadata.IterationNum, nil
}

// PublishImage publishes a generated image to permanent storage and the database.
// Returns the new image ID.
func (s *ImageService) PublishImage(
	ctx context.Context,
	userID uuid.UUID,
	jobID, visibility string,
) (uuid.UUID, error) {
	metadata, err := s.redisClient.GetJobMetadata(ctx, jobID)
	if err != nil {
		return uuid.Nil, fmt.Errorf("%w: %v", ErrNotFound, err)
	}

	if metadata.UserID != userID {
		return uuid.Nil, ErrForbidden
	}

	if len(metadata.GeneratedKeys) == 0 {
		return uuid.Nil, fmt.Errorf("%w: image generation not completed yet", ErrBadRequest)
	}

	exists, err := s.storageSvc.CheckTmpResultExists(ctx, jobID, metadata.IterationNum)
	if err != nil || !exists {
		return uuid.Nil, fmt.Errorf("%w: generated image not found in storage", ErrNotFound)
	}

	imageID := uuid.New()
	permanentOriginalKey, permanentGeneratedKey, err := s.storageSvc.PublishFiles(
		ctx, jobID, imageID, metadata.OriginalExt, metadata.IterationNum, visibility,
	)
	if err != nil {
		return uuid.Nil, fmt.Errorf("copy files to permanent storage: %w", err)
	}

	image := &models.Image{
		ID:           imageID,
		UserID:       metadata.UserID,
		JobID:        metadata.JobID,
		Prompts:      metadata.Prompts,
		OriginalKey:  permanentOriginalKey,
		GeneratedKey: permanentGeneratedKey,
		Width:        metadata.Width,
		Height:       metadata.Height,
		Visibility:   visibility,
		IterationNum: metadata.IterationNum,
	}

	if err := s.repo.CreateImage(ctx, image); err != nil {
		go func() {
			cleanCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()
			_ = s.storageSvc.DeleteObject(cleanCtx, permanentOriginalKey)
			_ = s.storageSvc.DeleteObject(cleanCtx, permanentGeneratedKey)
		}()
		return uuid.Nil, fmt.Errorf("create image record: %w", err)
	}

	go s.generateThumbnailAsync(imageID, visibility, permanentGeneratedKey)

	go func(jid string) {
		cleanCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := s.redisClient.DeleteJobMetadata(cleanCtx, jid); err != nil {
			logger.Error().Err(err).Str("job_id", jid).Msg("Failed to delete job metadata from Redis")
		}
	}(jobID)

	logger.Info().
		Str("job_id", jobID).
		Str("user_id", userID.String()).
		Str("image_id", imageID.String()).
		Str("visibility", visibility).
		Msg("Image published successfully")

	return imageID, nil
}

func (s *ImageService) generateThumbnailAsync(imageID uuid.UUID, visibility, generatedKey string) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	thumbnailSvc := thumbnail.NewThumbnailService(s.storageSvc)
	thumbnailKey, err := thumbnailSvc.GenerateThumbnail(ctx, imageID, visibility, generatedKey)
	if err != nil {
		logger.Error().Err(err).Str("image_id", imageID.String()).Msg("Failed to generate thumbnail")
		return
	}

	if err := s.repo.UpdateImageThumbnailKey(ctx, imageID, thumbnailKey); err != nil {
		logger.Error().Err(err).Str("image_id", imageID.String()).Msg("Failed to update image record with thumbnail key")
		return
	}

	logger.Info().
		Str("image_id", imageID.String()).
		Str("thumbnail_key", thumbnailKey).
		Msg("Thumbnail generated and database updated successfully")
}

// GetPublicImages returns a paginated list of public images with optional like state.
func (s *ImageService) GetPublicImages(
	ctx context.Context,
	userID *uuid.UUID,
	params dto.PaginationParams,
) ([]dto.ImageFeedItemDTO, bool, error) {
	images, err := s.repo.GetPublicImages(ctx, params)
	if err != nil {
		return nil, false, fmt.Errorf("fetch public images: %w", err)
	}

	var likedMap map[uuid.UUID]bool
	if userID != nil {
		ids := make([]uuid.UUID, len(images))
		for i, img := range images {
			ids[i] = img.ID
		}
		if m, err := s.repo.GetLikedImageIDs(ctx, *userID, ids); err == nil {
			likedMap = m
		}
	}

	items := make([]dto.ImageFeedItemDTO, 0, len(images))
	for _, img := range images {
		item, err := dto.NewImageFeedItemDTO(ctx, img, s.storageSvc, likedMap)
		if err != nil {
			return nil, false, fmt.Errorf("build image DTO: %w", err)
		}
		items = append(items, item)
	}

	return items, len(images) == params.Limit, nil
}

// GetMyImages returns the authenticated user's images filtered by visibility.
func (s *ImageService) GetMyImages(
	ctx context.Context,
	userID uuid.UUID,
	visibility string,
	params dto.PaginationParams,
) ([]dto.ImageFeedItemDTO, bool, error) {
	images, err := s.repo.GetUserImages(ctx, userID, visibility, params)
	if err != nil {
		return nil, false, fmt.Errorf("fetch user images: %w", err)
	}

	ids := make([]uuid.UUID, len(images))
	for i, img := range images {
		ids[i] = img.ID
	}
	likedMap, err := s.repo.GetLikedImageIDs(ctx, userID, ids)
	if err != nil {
		return nil, false, fmt.Errorf("fetch like state: %w", err)
	}

	items := make([]dto.ImageFeedItemDTO, 0, len(images))
	for _, img := range images {
		item, err := dto.NewImageFeedItemDTO(ctx, img, s.storageSvc, likedMap)
		if err != nil {
			return nil, false, fmt.Errorf("build image DTO: %w", err)
		}
		items = append(items, item)
	}

	return items, len(images) == params.Limit, nil
}

// GetImageByID returns a single image by ID.
func (s *ImageService) GetImageByID(ctx context.Context, imageID uuid.UUID) (*dto.ImageDetailDTO, error) {
	img, err := s.repo.GetImageByID(ctx, imageID)
	if err != nil {
		if repository.IsNotFoundError(err) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("fetch image: %w", err)
	}

	detail, err := dto.NewImageDetailDTO(ctx, img, s.storageSvc)
	if err != nil {
		return nil, fmt.Errorf("build image DTO: %w", err)
	}

	return &detail, nil
}

// LikeImage creates a like record for the user on the image.
func (s *ImageService) LikeImage(ctx context.Context, userID, imageID uuid.UUID) error {
	if err := s.repo.LikeImage(ctx, userID, imageID); err != nil {
		if repository.IsNotFoundError(err) {
			return ErrNotFound
		}
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code == "23505" {
			return ErrConflict
		}
		return fmt.Errorf("like image: %w", err)
	}
	return nil
}

// UnlikeImage removes a like record.
func (s *ImageService) UnlikeImage(ctx context.Context, userID, imageID uuid.UUID) error {
	if err := s.repo.UnlikeImage(ctx, userID, imageID); err != nil {
		if repository.IsNotFoundError(err) {
			return ErrNotFound
		}
		return fmt.Errorf("unlike image: %w", err)
	}
	return nil
}

// HasUserLikedImage checks whether the user has liked the image.
func (s *ImageService) HasUserLikedImage(ctx context.Context, userID, imageID uuid.UUID) (bool, error) {
	liked, err := s.repo.HasUserLikedImage(ctx, userID, imageID)
	if err != nil {
		return false, fmt.Errorf("check like status: %w", err)
	}
	return liked, nil
}
