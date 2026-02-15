package dto

import (
	"time"

	"github.com/google/uuid"
)

// GetMeResponse represents the response for the /auth/me endpoint
type GetMeResponse struct {
	ID        uuid.UUID `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	AvatarURL *string   `json:"avatar_url,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}
