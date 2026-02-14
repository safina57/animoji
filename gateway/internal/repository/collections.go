package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/models"
	"gorm.io/gorm"
)

// CreateCollection creates a new collection
func (r *Repository) CreateCollection(ctx context.Context, collection *models.Collection) error {
	if err := r.db.WithContext(ctx).Create(collection).Error; err != nil {
		return fmt.Errorf("failed to create collection: %w", err)
	}
	return nil
}

// GetCollectionByID retrieves a collection by its ID
func (r *Repository) GetCollectionByID(ctx context.Context, collectionID uuid.UUID) (*models.Collection, error) {
	var collection models.Collection

	if err := r.db.WithContext(ctx).
		Preload("User").
		Where("id = ?", collectionID).
		First(&collection).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("collection not found")
		}
		return nil, fmt.Errorf("failed to get collection: %w", err)
	}

	return &collection, nil
}

// GetUserCollections retrieves all collections for a user
func (r *Repository) GetUserCollections(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*models.Collection, error) {
	var collections []*models.Collection

	if err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&collections).Error; err != nil {
		return nil, fmt.Errorf("failed to get user collections: %w", err)
	}

	return collections, nil
}

// GetPublicCollections retrieves public collections
func (r *Repository) GetPublicCollections(ctx context.Context, limit, offset int) ([]*models.Collection, error) {
	var collections []*models.Collection

	if err := r.db.WithContext(ctx).
		Preload("User").
		Where("is_public = ?", true).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&collections).Error; err != nil {
		return nil, fmt.Errorf("failed to get public collections: %w", err)
	}

	return collections, nil
}

// UpdateCollection updates an existing collection
func (r *Repository) UpdateCollection(ctx context.Context, collection *models.Collection) error {
	if err := r.db.WithContext(ctx).Save(collection).Error; err != nil {
		return fmt.Errorf("failed to update collection: %w", err)
	}
	return nil
}

// DeleteCollection soft deletes a collection
func (r *Repository) DeleteCollection(ctx context.Context, collectionID uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&models.Collection{}, collectionID).Error; err != nil {
		return fmt.Errorf("failed to delete collection: %w", err)
	}
	return nil
}

// AddImageToCollection adds an image to a collection
func (r *Repository) AddImageToCollection(ctx context.Context, collectionID, imageID uuid.UUID) error {
	item := &models.CollectionItem{
		CollectionID: collectionID,
		ImageID:      imageID,
	}

	if err := r.db.WithContext(ctx).Create(item).Error; err != nil {
		return fmt.Errorf("failed to add image to collection: %w", err)
	}
	return nil
}

// RemoveImageFromCollection removes an image from a collection
func (r *Repository) RemoveImageFromCollection(ctx context.Context, collectionID, imageID uuid.UUID) error {
	result := r.db.WithContext(ctx).
		Where("collection_id = ? AND image_id = ?", collectionID, imageID).
		Delete(&models.CollectionItem{})

	if result.Error != nil {
		return fmt.Errorf("failed to remove image from collection: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("image not found in collection")
	}

	return nil
}

// GetCollectionImages retrieves all images in a collection
func (r *Repository) GetCollectionImages(ctx context.Context, collectionID uuid.UUID, limit, offset int) ([]*models.Image, error) {
	var images []*models.Image

	if err := r.db.WithContext(ctx).
		Joins("JOIN collection_items ON collection_items.image_id = images.id").
		Where("collection_items.collection_id = ?", collectionID).
		Preload("User").
		Order("collection_items.added_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&images).Error; err != nil {
		return nil, fmt.Errorf("failed to get collection images: %w", err)
	}

	return images, nil
}

// IsImageInCollection checks if an image is in a collection
func (r *Repository) IsImageInCollection(ctx context.Context, collectionID, imageID uuid.UUID) (bool, error) {
	var count int64

	if err := r.db.WithContext(ctx).
		Model(&models.CollectionItem{}).
		Where("collection_id = ? AND image_id = ?", collectionID, imageID).
		Count(&count).Error; err != nil {
		return false, fmt.Errorf("failed to check image in collection: %w", err)
	}

	return count > 0, nil
}

// CountCollectionImages returns the number of images in a collection
func (r *Repository) CountCollectionImages(ctx context.Context, collectionID uuid.UUID) (int64, error) {
	var count int64

	if err := r.db.WithContext(ctx).
		Model(&models.CollectionItem{}).
		Where("collection_id = ?", collectionID).
		Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count collection images: %w", err)
	}

	return count, nil
}
