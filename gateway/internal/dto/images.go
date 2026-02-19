package dto

import (
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

// NewImageFeedItemDTO builds an ImageFeedItemDTO for the public feed.
// likedMap should be non-nil only for authenticated requests; when non-nil,
// IsLikedByUser is populated for every image.
func NewImageFeedItemDTO(img *models.Image, storageService *storage.MinIOService, likedMap map[uuid.UUID]bool) ImageFeedItemDTO {
	thumbnailURL := storageService.GetPublicURL(img.GeneratedKey)
	if img.ThumbnailKey != "" {
		thumbnailURL = storageService.GetPublicURL(img.ThumbnailKey)
	}

	avatarURL := ""
	if img.User.AvatarURL != nil {
		avatarURL = *img.User.AvatarURL
	}

	item := ImageFeedItemDTO{
		ID:           img.ID,
		ThumbnailURL: thumbnailURL,
		GeneratedURL: storageService.GetPublicURL(img.GeneratedKey),
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

	return item
}

// NewImageDetailDTO builds an ImageDetailDTO (with full metadata) for the detail endpoint
func NewImageDetailDTO(img *models.Image, storageService *storage.MinIOService) ImageDetailDTO {
	prompts := make([]string, len(img.Prompts))
	copy(prompts, img.Prompts)

	return ImageDetailDTO{
		ImageFeedItemDTO: NewImageFeedItemDTO(img, storageService, nil),
		Prompts:          prompts,
		CreatedAt:        img.CreatedAt,
		LikesCount:       img.LikesCount,
	}
}
