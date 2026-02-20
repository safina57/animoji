package dto

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/models"
	"github.com/safina57/animoji/gateway/pkg/storage"
)

// SubmitJobResponse is returned when a job is successfully submitted to the queue
type SubmitJobResponse struct {
	JobID   string `json:"job_id"`
	Message string `json:"message"`
}

// JobStatusResponse is returned by the job status endpoint
type JobStatusResponse struct {
	JobID       string `json:"job_id"`
	Status      string `json:"status"`
	OriginalURL string `json:"original_url,omitempty"`
	ResultURL   string `json:"result_url,omitempty"`
}

// UpdateImageRequest represents a request to update image metadata
type UpdateImageRequest struct {
	ID          uuid.UUID `json:"id" validate:"required,uuid"`
	Prompt      string    `json:"prompt" validate:"omitempty,max=500"`
	IsPublic    *bool     `json:"is_public"`
	Description string    `json:"description" validate:"omitempty,max=1000"`
}

// ImageUserDTO is a minimal user representation for feed items
type ImageUserDTO struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	AvatarURL string    `json:"avatar_url"`
}

// ImageFeedItemDTO represents a single item in the public feed (no likes count)
type ImageFeedItemDTO struct {
	ID            uuid.UUID    `json:"id"`
	ThumbnailURL  string       `json:"thumbnail_url"`
	GeneratedURL  string       `json:"generated_url"`
	User          ImageUserDTO `json:"user"`
	IsLikedByUser *bool        `json:"is_liked_by_user,omitempty"` // nil when not authenticated
}

// ImageDetailDTO extends the feed item with full metadata for the detail endpoint
type ImageDetailDTO struct {
	ImageFeedItemDTO
	Prompts    []string  `json:"prompts"`
	CreatedAt  time.Time `json:"created_at"`
	LikesCount int       `json:"likes_count"`
}

// PublicImagesResponseDTO wraps a paginated list of public feed items
type PublicImagesResponseDTO struct {
	Images  []ImageFeedItemDTO `json:"images"`
	HasMore bool               `json:"has_more"`
	Offset  int                `json:"offset"`
	Limit   int                `json:"limit"`
}

// NewImageFeedItemDTO builds an ImageFeedItemDTO.
// Private object keys get presigned URLs; public keys get plain public URLs.
// likedMap should be non-nil only for authenticated requests.
func NewImageFeedItemDTO(ctx context.Context, img *models.Image, storageService *storage.MinIOService, likedMap map[uuid.UUID]bool) (ImageFeedItemDTO, error) {
	generatedURL, err := storageService.GetURLForKey(ctx, img.GeneratedKey)
	if err != nil {
		return ImageFeedItemDTO{}, err
	}

	thumbnailURL := generatedURL
	if img.ThumbnailKey != "" {
		thumbnailURL, err = storageService.GetURLForKey(ctx, img.ThumbnailKey)
		if err != nil {
			return ImageFeedItemDTO{}, err
		}
	}

	avatarURL := ""
	if img.User.AvatarURL != nil {
		avatarURL = *img.User.AvatarURL
	}

	item := ImageFeedItemDTO{
		ID:           img.ID,
		ThumbnailURL: thumbnailURL,
		GeneratedURL: generatedURL,
		User: ImageUserDTO{
			ID:        img.User.ID,
			Name:      img.User.Name,
			AvatarURL: avatarURL,
		},
	}

	if likedMap != nil {
		liked := likedMap[img.ID]
		item.IsLikedByUser = &liked
	}

	return item, nil
}

// NewImageDetailDTO builds an ImageDetailDTO (with full metadata) for the detail endpoint
func NewImageDetailDTO(ctx context.Context, img *models.Image, storageService *storage.MinIOService) (ImageDetailDTO, error) {
	feedItem, err := NewImageFeedItemDTO(ctx, img, storageService, nil)
	if err != nil {
		return ImageDetailDTO{}, err
	}

	prompts := make([]string, len(img.Prompts))
	copy(prompts, img.Prompts)

	return ImageDetailDTO{
		ImageFeedItemDTO: feedItem,
		Prompts:          prompts,
		CreatedAt:        img.CreatedAt,
		LikesCount:       img.LikesCount,
	}, nil
}
