package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/models"
)

// CreateUser creates a new user in the database
func (r *Repository) CreateUser(ctx context.Context, googleID, email, name string, avatarURL *string) (*models.User, error) {
	user := &models.User{
		GoogleID:  googleID,
		Email:     email,
		Name:      name,
		AvatarURL: avatarURL,
	}

	if err := r.db.WithContext(ctx).Create(user).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

// GetUserByID retrieves a user by their ID
func (r *Repository) GetUserByID(ctx context.Context, userID uuid.UUID) (*models.User, error) {
	var user models.User

	if err := r.db.WithContext(ctx).Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, WrapDBError(err, "user")
	}

	return &user, nil
}

// GetUserByEmail retrieves a user by their email address
func (r *Repository) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User

	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error; err != nil {
		return nil, WrapDBError(err, "user")
	}

	return &user, nil
}

// GetUserByGoogleID retrieves a user by their Google ID
func (r *Repository) GetUserByGoogleID(ctx context.Context, googleID string) (*models.User, error) {
	var user models.User

	if err := r.db.WithContext(ctx).Where("google_id = ?", googleID).First(&user).Error; err != nil {
		return nil, WrapDBError(err, "user")
	}

	return &user, nil
}

// CreateOrUpdateUser creates a new user or updates if they already exist (for OAuth)
func (r *Repository) CreateOrUpdateUser(ctx context.Context, googleID, email, name string, avatarURL *string) (*models.User, error) {
	var user models.User

	// Try to find existing user by Google ID
	err := r.db.WithContext(ctx).Where("google_id = ?", googleID).First(&user).Error

	// Check if this is a NotFoundError (user doesn't exist)
	if err != nil {
		wrappedErr := WrapDBError(err, "user")
		if IsNotFoundError(wrappedErr) {
			// User doesn't exist, create new one
			return r.CreateUser(ctx, googleID, email, name, avatarURL)
		}
		return nil, fmt.Errorf("failed to check existing user: %w", wrappedErr)
	}

	// User exists, update their info
	user.Email = email
	user.Name = name
	user.AvatarURL = avatarURL

	if err := r.db.WithContext(ctx).Save(&user).Error; err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return &user, nil
}

// UpdateUser updates an existing user
func (r *Repository) UpdateUser(ctx context.Context, user *models.User) error {
	if err := r.db.WithContext(ctx).Save(user).Error; err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}
	return nil
}

// DeleteUser soft deletes a user
func (r *Repository) DeleteUser(ctx context.Context, userID uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&models.User{}, userID).Error; err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}
	return nil
}

// ListUsers retrieves all users with pagination
func (r *Repository) ListUsers(ctx context.Context, params PaginationParams) ([]*models.User, error) {
	// Normalize pagination parameters
	params.Normalize()

	var users []*models.User

	if err := r.db.WithContext(ctx).Limit(params.Limit).Offset(params.Offset).Find(&users).Error; err != nil {
		return nil, fmt.Errorf("failed to list users: %w", err)
	}

	return users, nil
}

// CountUsers returns the total number of users
func (r *Repository) CountUsers(ctx context.Context) (int64, error) {
	var count int64

	if err := r.db.WithContext(ctx).Model(&models.User{}).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count users: %w", err)
	}

	return count, nil
}
