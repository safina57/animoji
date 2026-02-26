package emojis

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/cache"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/internal/dto"
	"github.com/safina57/animoji/gateway/internal/jobs"
	"github.com/safina57/animoji/gateway/internal/messaging"
	"github.com/safina57/animoji/gateway/internal/models"
	"github.com/safina57/animoji/gateway/internal/repository"
	"github.com/safina57/animoji/gateway/internal/services/storage"
	"github.com/safina57/animoji/gateway/pkg/logger"
)

var (
	ErrNotFound   = errors.New("not found")
	ErrForbidden  = errors.New("forbidden")
	ErrBadRequest = errors.New("bad request")
)

// EmojiService handles business logic for emoji operations.
type EmojiService struct {
	repo        *repository.Repository
	storageSvc  *storage.MinIOService
	redisClient *cache.RedisClient
	natsClient  *messaging.NatsClient
}

// NewEmojiService creates a new EmojiService with injected dependencies.
func NewEmojiService(
	repo *repository.Repository,
	storageSvc *storage.MinIOService,
	redisClient *cache.RedisClient,
	natsClient *messaging.NatsClient,
) *EmojiService {
	return &EmojiService{
		repo:        repo,
		storageSvc:  storageSvc,
		redisClient: redisClient,
		natsClient:  natsClient,
	}
}

// SubmitEmojiJob uploads the original image, caches metadata, and publishes to NATS.
// Returns the new job ID.
func (s *EmojiService) SubmitEmojiJob(
	ctx context.Context,
	userID uuid.UUID,
	imageData []byte,
	ext, mimeType, prompt string,
) (string, error) {
	jobID := uuid.New().String()

	inputKey, err := s.storageSvc.UploadTmpEmojiOriginal(ctx, jobID, imageData, ext, mimeType)
	if err != nil {
		return "", fmt.Errorf("upload emoji original: %w", err)
	}

	metadata := &cache.EmojiJobMetadata{
		JobID:             jobID,
		UserID:            userID,
		Prompt:            prompt,
		OriginalKey:       inputKey,
		OriginalExt:       ext,
		TotalVariants:     0,
		CompletedVariants: []cache.EmojiVariantResult{},
		CreatedAt:         time.Now(),
	}
	if cacheErr := s.redisClient.SetEmojiJobMetadata(ctx, jobID, metadata); cacheErr != nil {
		logger.Error().Err(cacheErr).Str("job_id", jobID).Msg("Failed to cache emoji job metadata in Redis")
	}

	msg := jobs.EmojiJobMessage{
		JobID:    jobID,
		InputKey: inputKey,
		Prompt:   prompt,
		MIMEType: mimeType,
	}
	payload, err := json.Marshal(msg)
	if err != nil {
		return "", fmt.Errorf("marshal NATS message: %w", err)
	}

	if err := s.natsClient.Publish(constants.NatsSubjectEmojiGenerate, payload); err != nil {
		return "", fmt.Errorf("publish to NATS: %w", err)
	}

	logger.Info().
		Str("job_id", jobID).
		Str("user_id", userID.String()).
		Str("prompt", prompt).
		Str("input_key", inputKey).
		Msg("Emoji job submitted successfully")

	return jobID, nil
}

// PublishEmojiVariantResult holds the response for a successful emoji variant publish.
type PublishEmojiVariantResult struct {
	Emotion          string
	URL              string
	AlreadyPublished bool
}

// PublishEmojiVariant copies a variant from tmp storage to permanent storage and persists to DB.
func (s *EmojiService) PublishEmojiVariant(
	ctx context.Context,
	userID uuid.UUID,
	jobID, variantID string,
) (*PublishEmojiVariantResult, error) {
	metadata, err := s.redisClient.GetEmojiJobMetadata(ctx, jobID)
	if err != nil {
		return nil, fmt.Errorf("%w: emoji job not found or expired", ErrNotFound)
	}

	if metadata.UserID != userID {
		return nil, ErrForbidden
	}

	var emotion, generatedKey string
	for _, v := range metadata.CompletedVariants {
		if v.VariantID == variantID {
			emotion = v.Emotion
			generatedKey = v.ResultKey
			break
		}
	}
	if generatedKey == "" {
		return nil, fmt.Errorf("%w: emoji variant not found or not yet completed", ErrNotFound)
	}

	pack, err := s.repo.FindOrCreateEmojiPack(ctx, jobID, metadata.UserID)
	if err != nil {
		return nil, fmt.Errorf("find or create emoji pack: %w", err)
	}

	// Idempotency: return existing URL if already published.
	existing, err := s.repo.GetEmojiVariantByPackAndEmotion(ctx, pack.ID, emotion)
	if err != nil {
		return nil, fmt.Errorf("query existing emoji variant: %w", err)
	}
	if existing != nil {
		return &PublishEmojiVariantResult{
			Emotion:          emotion,
			URL:              s.storageSvc.GetPublicURL(existing.ResultKey),
			AlreadyPublished: true,
		}, nil
	}

	resultKeys, err := s.storageSvc.PublishEmojiFiles(ctx, jobID, pack.ID, []string{emotion})
	if err != nil {
		return nil, fmt.Errorf("copy emoji variant to permanent storage: %w", err)
	}

	resultKey := resultKeys[emotion]

	variant := &models.EmojiVariant{
		ID:        uuid.New(),
		PackID:    pack.ID,
		Emotion:   emotion,
		ResultKey: resultKey,
	}
	if err := s.repo.CreateEmojiVariant(ctx, variant); err != nil {
		go func() {
			cleanCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()
			_ = s.storageSvc.DeleteObject(cleanCtx, resultKey)
		}()
		return nil, fmt.Errorf("create emoji variant record: %w", err)
	}

	logger.Info().
		Str("job_id", jobID).
		Str("emotion", emotion).
		Str("pack_id", pack.ID.String()).
		Str("user_id", userID.String()).
		Msg("Emoji variant published successfully")

	return &PublishEmojiVariantResult{
		Emotion: emotion,
		URL:     s.storageSvc.GetPublicURL(resultKey),
	}, nil
}

// GetMyEmojiPacks returns the authenticated user's published emoji packs.
func (s *EmojiService) GetMyEmojiPacks(
	ctx context.Context,
	userID uuid.UUID,
	params dto.PaginationParams,
) ([]dto.EmojiPackDTO, bool, error) {
	packs, err := s.repo.GetUserEmojiPacks(ctx, userID, params)
	if err != nil {
		return nil, false, fmt.Errorf("fetch emoji packs: %w", err)
	}

	items := make([]dto.EmojiPackDTO, len(packs))
	for i, pack := range packs {
		items[i] = dto.NewEmojiPackDTO(pack, s.storageSvc)
	}

	return items, len(packs) == params.Limit, nil
}
