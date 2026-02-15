package models

import (
	"time"

	"github.com/google/uuid"
)

// Like represents a user liking an image
type Like struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index:idx_likes_user_id;uniqueIndex:idx_user_image_unique" json:"user_id"`
	ImageID   uuid.UUID `gorm:"type:uuid;not null;index:idx_likes_image_id;uniqueIndex:idx_user_image_unique" json:"image_id"`
	CreatedAt time.Time `gorm:"not null;default:now()" json:"created_at"`

	// Relationships
	User  User  `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
	Image Image `gorm:"foreignKey:ImageID;constraint:OnDelete:CASCADE" json:"image,omitempty"`
}

// TableName specifies the table name for the Like model
func (Like) TableName() string {
	return "likes"
}
