package repository

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/dto"
	"github.com/safina57/animoji/gateway/internal/models"
)

// CreateShareLink creates a new share link with a 1-hour expiration
func (r *Repository) CreateShareLink(ctx context.Context, imageID, userID uuid.UUID) (*models.ShareLink, error) {
	// Generate cryptographically secure token
	token, err := generateSecureToken(32)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	shareLink := &models.ShareLink{
		Token:     token,
		ImageID:   imageID,
		CreatedBy: userID,
		ExpiresAt: time.Now().UTC().Add(1 * time.Hour), // 1-hour expiration
	}

	if err := r.db.WithContext(ctx).Create(shareLink).Error; err != nil {
		return nil, fmt.Errorf("failed to create share link: %w", err)
	}

	return shareLink, nil
}

// CreateShareLinkWithDuration creates a share link with custom expiration duration
func (r *Repository) CreateShareLinkWithDuration(ctx context.Context, imageID, userID uuid.UUID, duration time.Duration) (*models.ShareLink, error) {
	token, err := generateSecureToken(32)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	shareLink := &models.ShareLink{
		Token:     token,
		ImageID:   imageID,
		CreatedBy: userID,
		ExpiresAt: time.Now().UTC().Add(duration),
	}

	if err := r.db.WithContext(ctx).Create(shareLink).Error; err != nil {
		return nil, fmt.Errorf("failed to create share link: %w", err)
	}

	return shareLink, nil
}

// GetShareLinkByToken retrieves a share link by its token
func (r *Repository) GetShareLinkByToken(ctx context.Context, token string) (*models.ShareLink, error) {
	var shareLink models.ShareLink

	if err := r.db.WithContext(ctx).
		Preload("Image").
		Preload("Image.User").
		Where("token = ?", token).
		First(&shareLink).Error; err != nil {
		return nil, WrapDBError(err, "share link")
	}

	return &shareLink, nil
}

// ValidateShareLink validates a share link and returns the associated image if valid
func (r *Repository) ValidateShareLink(ctx context.Context, token string) (*models.Image, error) {
	shareLink, err := r.GetShareLinkByToken(ctx, token)
	if err != nil {
		return nil, err
	}

	// Check if expired
	if shareLink.IsExpired() {
		return nil, fmt.Errorf("share link has expired")
	}

	return &shareLink.Image, nil
}

// GetShareLinksForImage retrieves all share links for an image
func (r *Repository) GetShareLinksForImage(ctx context.Context, imageID uuid.UUID) ([]*models.ShareLink, error) {
	var shareLinks []*models.ShareLink

	if err := r.db.WithContext(ctx).
		Where("image_id = ?", imageID).
		Order("created_at DESC").
		Find(&shareLinks).Error; err != nil {
		return nil, fmt.Errorf("failed to get share links: %w", err)
	}

	return shareLinks, nil
}

// GetUserShareLinks retrieves all share links created by a user
func (r *Repository) GetUserShareLinks(ctx context.Context, userID uuid.UUID, params dto.PaginationParams) ([]*models.ShareLink, error) {

	var shareLinks []*models.ShareLink

	if err := r.db.WithContext(ctx).
		Preload("Image").
		Where("created_by = ?", userID).
		Order("created_at DESC").
		Limit(params.Limit).
		Offset(params.Offset).
		Find(&shareLinks).Error; err != nil {
		return nil, fmt.Errorf("failed to get user share links: %w", err)
	}

	return shareLinks, nil
}

// DeleteShareLink deletes a share link
func (r *Repository) DeleteShareLink(ctx context.Context, token string) error {
	result := r.db.WithContext(ctx).Where("token = ?", token).Delete(&models.ShareLink{})

	if result.Error != nil {
		return fmt.Errorf("failed to delete share link: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return NewNotFoundError("share link", token)
	}

	return nil
}

// CleanupExpiredShareLinks deletes all expired share links
func (r *Repository) CleanupExpiredShareLinks(ctx context.Context) (int64, error) {
	result := r.db.WithContext(ctx).
		Where("expires_at < ?", time.Now().UTC()).
		Delete(&models.ShareLink{})

	if result.Error != nil {
		return 0, fmt.Errorf("failed to cleanup expired share links: %w", result.Error)
	}

	return result.RowsAffected, nil
}

// generateSecureToken generates a cryptographically secure random token
func generateSecureToken(length int) (string, error) {
	bytes := make([]byte, length)
	rand.Read(bytes)
	return hex.EncodeToString(bytes), nil
}
