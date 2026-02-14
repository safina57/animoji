package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/models"
	"gorm.io/gorm"
)

// CreateImage creates a new image record
func (r *Repository) CreateImage(ctx context.Context, image *models.Image) error {
	if err := r.db.WithContext(ctx).Create(image).Error; err != nil {
		return fmt.Errorf("failed to create image: %w", err)
	}
	return nil
}

// GetImageByID retrieves an image by its ID
func (r *Repository) GetImageByID(ctx context.Context, imageID uuid.UUID) (*models.Image, error) {
	var image models.Image

	if err := r.db.WithContext(ctx).Preload("User").Where("id = ?", imageID).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("image not found")
		}
		return nil, fmt.Errorf("failed to get image: %w", err)
	}

	return &image, nil
}

// GetImageByJobID retrieves an image by its job ID
func (r *Repository) GetImageByJobID(ctx context.Context, jobID string) (*models.Image, error) {
	var image models.Image

	if err := r.db.WithContext(ctx).Preload("User").Where("job_id = ?", jobID).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("image not found")
		}
		return nil, fmt.Errorf("failed to get image: %w", err)
	}

	return &image, nil
}

// GetUserImages retrieves all images for a user with optional visibility filter
func (r *Repository) GetUserImages(ctx context.Context, userID uuid.UUID, visibility string, limit, offset int) ([]*models.Image, error) {
	var images []*models.Image

	query := r.db.WithContext(ctx).Where("user_id = ?", userID)

	if visibility != "" && visibility != "all" {
		query = query.Where("visibility = ?", visibility)
	}

	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&images).Error; err != nil {
		return nil, fmt.Errorf("failed to get user images: %w", err)
	}

	return images, nil
}

// GetPublicImages retrieves public images with pagination
func (r *Repository) GetPublicImages(ctx context.Context, limit, offset int) ([]*models.Image, error) {
	var images []*models.Image

	if err := r.db.WithContext(ctx).
		Preload("User").
		Where("visibility = ?", models.VisibilityPublic).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&images).Error; err != nil {
		return nil, fmt.Errorf("failed to get public images: %w", err)
	}

	return images, nil
}

// UpdateImage updates an existing image
func (r *Repository) UpdateImage(ctx context.Context, image *models.Image) error {
	if err := r.db.WithContext(ctx).Save(image).Error; err != nil {
		return fmt.Errorf("failed to update image: %w", err)
	}
	return nil
}

// UpdateImageVisibility updates the visibility of an image
func (r *Repository) UpdateImageVisibility(ctx context.Context, imageID uuid.UUID, visibility string) error {
	if err := r.db.WithContext(ctx).
		Model(&models.Image{}).
		Where("id = ?", imageID).
		Update("visibility", visibility).Error; err != nil {
		return fmt.Errorf("failed to update image visibility: %w", err)
	}
	return nil
}

// DeleteImage soft deletes an image
func (r *Repository) DeleteImage(ctx context.Context, imageID uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&models.Image{}, imageID).Error; err != nil {
		return fmt.Errorf("failed to delete image: %w", err)
	}
	return nil
}

// IncrementLikesCount increments the likes count for an image
func (r *Repository) IncrementLikesCount(ctx context.Context, imageID uuid.UUID) error {
	if err := r.db.WithContext(ctx).
		Model(&models.Image{}).
		Where("id = ?", imageID).
		UpdateColumn("likes_count", gorm.Expr("likes_count + ?", 1)).Error; err != nil {
		return fmt.Errorf("failed to increment likes count: %w", err)
	}
	return nil
}

// DecrementLikesCount decrements the likes count for an image
func (r *Repository) DecrementLikesCount(ctx context.Context, imageID uuid.UUID) error {
	if err := r.db.WithContext(ctx).
		Model(&models.Image{}).
		Where("id = ?", imageID).
		Where("likes_count > ?", 0).
		UpdateColumn("likes_count", gorm.Expr("likes_count - ?", 1)).Error; err != nil {
		return fmt.Errorf("failed to decrement likes count: %w", err)
	}
	return nil
}

// AddPromptToImage appends a new prompt to the image's prompts array
func (r *Repository) AddPromptToImage(ctx context.Context, imageID uuid.UUID, prompt string) error {
	if err := r.db.WithContext(ctx).
		Model(&models.Image{}).
		Where("id = ?", imageID).
		Update("prompts", gorm.Expr("array_append(prompts, ?)", prompt)).Error; err != nil {
		return fmt.Errorf("failed to add prompt to image: %w", err)
	}
	return nil
}
