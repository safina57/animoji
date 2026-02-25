package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/dto"
	"github.com/safina57/animoji/gateway/internal/models"
	"gorm.io/gorm"
)

// FindOrCreateEmojiPack returns the existing pack for jobID, or creates one.
// Safe for the common case; the unique index on job_id guards against duplicates.
func (r *Repository) FindOrCreateEmojiPack(ctx context.Context, jobID string, userID uuid.UUID) (*models.EmojiPack, error) {
	pack := models.EmojiPack{}
	result := r.db.WithContext(ctx).
		Where(models.EmojiPack{JobID: jobID}).
		Attrs(models.EmojiPack{
			ID:     uuid.New(),
			UserID: userID,
		}).
		FirstOrCreate(&pack)
	if result.Error != nil {
		return nil, WrapDBError(result.Error, "emoji pack")
	}
	return &pack, nil
}

// GetEmojiPackByJobID retrieves an emoji pack (with its variants) by job ID.
// Returns nil, nil if not found.
func (r *Repository) GetEmojiPackByJobID(ctx context.Context, jobID string) (*models.EmojiPack, error) {
	var pack models.EmojiPack
	err := r.db.WithContext(ctx).Preload("Variants").Where("job_id = ?", jobID).First(&pack).Error
	if err != nil {
		dbErr := WrapDBError(err, "emoji pack")
		if IsNotFoundError(dbErr) {
			return nil, nil
		}
		return nil, dbErr
	}
	return &pack, nil
}

// GetEmojiVariantByPackAndEmotion returns the variant if already published, nil if not.
func (r *Repository) GetEmojiVariantByPackAndEmotion(ctx context.Context, packID uuid.UUID, emotion string) (*models.EmojiVariant, error) {
	var variant models.EmojiVariant
	err := r.db.WithContext(ctx).
		Where("pack_id = ? AND emotion = ?", packID, emotion).
		First(&variant).Error
	if err != nil {
		dbErr := WrapDBError(err, "emoji variant")
		if IsNotFoundError(dbErr) {
			return nil, nil
		}
		return nil, dbErr
	}
	return &variant, nil
}

// CreateEmojiVariant persists a single published emoji variant.
func (r *Repository) CreateEmojiVariant(ctx context.Context, variant *models.EmojiVariant) error {
	if err := r.db.WithContext(ctx).Create(variant).Error; err != nil {
		return fmt.Errorf("creating emoji variant: %w", err)
	}
	return nil
}

// GetUserEmojiPacks retrieves a user's published emoji packs (with variants) ordered newest first.
func (r *Repository) GetUserEmojiPacks(ctx context.Context, userID uuid.UUID, params dto.PaginationParams) ([]*models.EmojiPack, error) {
	var packs []*models.EmojiPack
	err := r.db.WithContext(ctx).
		Preload("Variants").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(params.Limit).
		Offset(params.Offset).
		Find(&packs).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get user emoji packs: %w", err)
	}
	return packs, nil
}

// CreateEmojiPack persists an emoji pack and its variants in a single transaction.
// Used by the (legacy) bulk publish path if needed.
func (r *Repository) CreateEmojiPack(ctx context.Context, pack *models.EmojiPack) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		variants := pack.Variants
		pack.Variants = nil

		if err := tx.Create(pack).Error; err != nil {
			return fmt.Errorf("creating emoji pack: %w", err)
		}

		for i := range variants {
			variants[i].PackID = pack.ID
		}

		if len(variants) > 0 {
			if err := tx.Create(&variants).Error; err != nil {
				return fmt.Errorf("creating emoji variants: %w", err)
			}
		}

		return nil
	})
}
