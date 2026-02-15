package models

import (
	"time"

	"github.com/google/uuid"
)

// ShareLink represents a temporary shareable link for an image
type ShareLink struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Token     string    `gorm:"size:64;uniqueIndex;not null" json:"token"`
	ImageID   uuid.UUID `gorm:"type:uuid;not null;index" json:"image_id"`
	CreatedBy uuid.UUID `gorm:"type:uuid;not null" json:"created_by"`
	ExpiresAt time.Time `gorm:"not null;index:idx_share_links_expires" json:"expires_at"`
	CreatedAt time.Time `gorm:"not null;default:now()" json:"created_at"`

	// Relationships
	Image   Image `gorm:"foreignKey:ImageID;constraint:OnDelete:CASCADE" json:"image,omitempty"`
	Creator User  `gorm:"foreignKey:CreatedBy;constraint:OnDelete:CASCADE" json:"creator,omitempty"`
}

// TableName specifies the table name for the ShareLink model
func (ShareLink) TableName() string {
	return "share_links"
}

// IsExpired checks if the share link has expired
func (s *ShareLink) IsExpired() bool {
	return time.Now().UTC().After(s.ExpiresAt)
}
