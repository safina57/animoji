package auth

import (
	"context"
	"crypto/rsa"
	"fmt"

	"github.com/google/uuid"
	internalAuth "github.com/safina57/animoji/gateway/internal/auth"
	"github.com/safina57/animoji/gateway/internal/dto"
	"github.com/safina57/animoji/gateway/internal/repository"
)

// AuthService handles business logic for authentication operations.
type AuthService struct {
	repo       *repository.Repository
	privateKey *rsa.PrivateKey
	jwtExpiry  int
}

// NewAuthService creates a new AuthService with injected dependencies.
func NewAuthService(
	repo *repository.Repository,
	privateKey *rsa.PrivateKey,
	jwtExpiry int,
) *AuthService {
	return &AuthService{
		repo:       repo,
		privateKey: privateKey,
		jwtExpiry:  jwtExpiry,
	}
}

// UpsertGoogleUser creates or updates a user from Google OAuth info and returns a signed JWT.
func (s *AuthService) UpsertGoogleUser(
	ctx context.Context,
	googleID, email, name string,
	avatarURL *string,
) (string, error) {
	user, err := s.repo.CreateOrUpdateUser(ctx, googleID, email, name, avatarURL)
	if err != nil {
		return "", fmt.Errorf("upsert user: %w", err)
	}

	token, err := internalAuth.GenerateJWT(user.ID, user.Email, user.Name, s.privateKey, s.jwtExpiry)
	if err != nil {
		return "", fmt.Errorf("generate JWT: %w", err)
	}

	return token, nil
}

// GetMe fetches fresh user data from the database and builds a GetMeResponse.
func (s *AuthService) GetMe(ctx context.Context, userID uuid.UUID) (*dto.GetMeResponse, error) {
	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("fetch user: %w", err)
	}

	return &dto.GetMeResponse{
		ID:        user.ID,
		Email:     user.Email,
		Name:      user.Name,
		AvatarURL: user.AvatarURL,
		CreatedAt: user.CreatedAt,
	}, nil
}
