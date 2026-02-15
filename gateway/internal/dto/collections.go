package dto

import "github.com/google/uuid"

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
