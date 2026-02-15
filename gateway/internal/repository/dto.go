package repository

import (
	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/constants"
)

// PaginationParams represents validated pagination parameters
type PaginationParams struct {
	Limit  int `validate:"omitempty,min=1,max=100"`
	Offset int `validate:"omitempty,min=0"`
}

// Normalize applies defaults and ensures limits are within bounds
func (p *PaginationParams) Normalize() {
	// Apply default limit if not set
	if p.Limit <= 0 {
		p.Limit = constants.DefaultPageLimit
	}

	// Ensure limit doesn't exceed maximum
	if p.Limit > constants.MaxPageLimit {
		p.Limit = constants.MaxPageLimit
	}

	// Ensure offset is non-negative
	if p.Offset < 0 {
		p.Offset = 0
	}
}

// CreateCollectionRequest represents a request to create a collection
type CreateCollectionRequest struct {
	Name        string    `json:"name" validate:"required,min=1,max=100"`
	Description string    `json:"description" validate:"omitempty,max=500"`
	IsPublic    bool      `json:"is_public"`
	UserID      uuid.UUID `json:"user_id" validate:"required,uuid"`
}

// UpdateCollectionRequest represents a request to update a collection
type UpdateCollectionRequest struct {
	ID          uuid.UUID `json:"id" validate:"required,uuid"`
	Name        string    `json:"name" validate:"omitempty,min=1,max=100"`
	Description string    `json:"description" validate:"omitempty,max=500"`
	IsPublic    *bool     `json:"is_public"`
}

// CreateShareLinkRequest represents a request to create a share link
type CreateShareLinkRequest struct {
	ImageID   uuid.UUID `json:"image_id" validate:"required,uuid"`
	ExpiresIn int       `json:"expires_in" validate:"required,min=1,max=168"` // hours (max 7 days)
	CreatedBy uuid.UUID `json:"created_by" validate:"required,uuid"`
}

// UpdateImageRequest represents a request to update image metadata
type UpdateImageRequest struct {
	ID          uuid.UUID `json:"id" validate:"required,uuid"`
	Prompt      string    `json:"prompt" validate:"omitempty,max=500"`
	IsPublic    *bool     `json:"is_public"`
	Description string    `json:"description" validate:"omitempty,max=1000"`
}
