package dto

import "github.com/google/uuid"

// CreateShareLinkRequest represents a request to create a share link
type CreateShareLinkRequest struct {
	ImageID   uuid.UUID `json:"image_id" validate:"required,uuid"`
	ExpiresIn int       `json:"expires_in" validate:"required,min=1,max=168"` // hours (max 7 days)
	CreatedBy uuid.UUID `json:"created_by" validate:"required,uuid"`
}
