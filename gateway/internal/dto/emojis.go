package dto

import (
	"time"

	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/models"
	"github.com/safina57/animoji/gateway/internal/storage"
)

// EmojiVariantDTO represents a single published emoji variant in the gallery response.
type EmojiVariantDTO struct {
	ID      uuid.UUID `json:"id"`
	Emotion string    `json:"emotion"`
	URL     string    `json:"url"`
}

// EmojiPackDTO represents a published emoji pack with all its variants.
type EmojiPackDTO struct {
	ID        uuid.UUID         `json:"id"`
	JobID     string            `json:"job_id"`
	CreatedAt time.Time         `json:"created_at"`
	Variants  []EmojiVariantDTO `json:"variants"`
}

// EmojiPacksResponseDTO wraps a paginated list of emoji packs.
type EmojiPacksResponseDTO struct {
	Packs   []EmojiPackDTO `json:"packs"`
	HasMore bool           `json:"has_more"`
	Offset  int            `json:"offset"`
	Limit   int            `json:"limit"`
}

// NewEmojiPackDTO builds an EmojiPackDTO from a model. Emoji result keys are always
// stored under the public prefix so plain public URLs are used (no presigning needed).
func NewEmojiPackDTO(pack *models.EmojiPack, storageService *storage.MinIOService) EmojiPackDTO {
	variants := make([]EmojiVariantDTO, len(pack.Variants))
	for i, v := range pack.Variants {
		variants[i] = EmojiVariantDTO{
			ID:      v.ID,
			Emotion: v.Emotion,
			URL:     storageService.GetPublicURL(v.ResultKey),
		}
	}
	return EmojiPackDTO{
		ID:        pack.ID,
		JobID:     pack.JobID,
		CreatedAt: pack.CreatedAt,
		Variants:  variants,
	}
}
