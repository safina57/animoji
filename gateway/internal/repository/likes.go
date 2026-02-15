package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/dto"
	"github.com/safina57/animoji/gateway/internal/models"
	"gorm.io/gorm"
)

// LikeImage creates a like record and increments the image's likes count
func (r *Repository) LikeImage(ctx context.Context, userID, imageID uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Create like record
		like := &models.Like{
			UserID:  userID,
			ImageID: imageID,
		}

		if err := tx.Create(like).Error; err != nil {
			return fmt.Errorf("failed to create like: %w", err)
		}

		// Increment likes count
		if err := tx.Model(&models.Image{}).
			Where("id = ?", imageID).
			UpdateColumn("likes_count", gorm.Expr("likes_count + ?", 1)).Error; err != nil {
			return fmt.Errorf("failed to increment likes count: %w", err)
		}

		return nil
	})
}

// UnlikeImage deletes a like record and decrements the image's likes count
func (r *Repository) UnlikeImage(ctx context.Context, userID, imageID uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Delete like record
		result := tx.Where("user_id = ? AND image_id = ?", userID, imageID).Delete(&models.Like{})
		if result.Error != nil {
			return fmt.Errorf("failed to delete like: %w", result.Error)
		}

		if result.RowsAffected == 0 {
			return NewNotFoundError("like", fmt.Sprintf("user:%s,image:%s", userID, imageID))
		}

		// Decrement likes count
		if err := tx.Model(&models.Image{}).
			Where("id = ?", imageID).
			Where("likes_count > ?", 0).
			UpdateColumn("likes_count", gorm.Expr("likes_count - ?", 1)).Error; err != nil {
			return fmt.Errorf("failed to decrement likes count: %w", err)
		}

		return nil
	})
}

// HasUserLikedImage checks if a user has liked an image
func (r *Repository) HasUserLikedImage(ctx context.Context, userID, imageID uuid.UUID) (bool, error) {
	var count int64

	if err := r.db.WithContext(ctx).
		Model(&models.Like{}).
		Where("user_id = ? AND image_id = ?", userID, imageID).
		Count(&count).Error; err != nil {
		return false, fmt.Errorf("failed to check like status: %w", err)
	}

	return count > 0, nil
}

// GetImageLikes retrieves all likes for an image with user information
func (r *Repository) GetImageLikes(ctx context.Context, imageID uuid.UUID, params dto.PaginationParams) ([]*models.Like, error) {

	var likes []*models.Like

	if err := r.db.WithContext(ctx).
		Preload("User").
		Where("image_id = ?", imageID).
		Order("created_at DESC").
		Limit(params.Limit).
		Offset(params.Offset).
		Find(&likes).Error; err != nil {
		return nil, fmt.Errorf("failed to get image likes: %w", err)
	}

	return likes, nil
}

// GetUserLikes retrieves all images liked by a user
func (r *Repository) GetUserLikes(ctx context.Context, userID uuid.UUID, params dto.PaginationParams) ([]*models.Image, error) {

	var images []*models.Image

	if err := r.db.WithContext(ctx).
		Joins("JOIN likes ON likes.image_id = images.id").
		Where("likes.user_id = ?", userID).
		Preload("User").
		Order("likes.created_at DESC").
		Limit(params.Limit).
		Offset(params.Offset).
		Find(&images).Error; err != nil {
		return nil, fmt.Errorf("failed to get user likes: %w", err)
	}

	return images, nil
}

// GetLikesCount returns the total number of likes for an image
func (r *Repository) GetLikesCount(ctx context.Context, imageID uuid.UUID) (int64, error) {
	var count int64

	if err := r.db.WithContext(ctx).
		Model(&models.Like{}).
		Where("image_id = ?", imageID).
		Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count likes: %w", err)
	}

	return count, nil
}
