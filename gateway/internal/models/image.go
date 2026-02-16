package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Image represents a generated anime-style image
type Image struct {
	ID              uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID          uuid.UUID      `gorm:"type:uuid;not null;index" json:"user_id"`
	JobID           string         `gorm:"uniqueIndex;not null" json:"job_id"`
	Prompts         []string       `gorm:"type:text[];not null" json:"prompts"` // Array of prompts (user can refine iteratively)
	OriginalKey  string `gorm:"size:500;not null" json:"original_key"`  // MinIO key
	GeneratedKey string `gorm:"size:500;not null" json:"generated_key"` // MinIO key
	ThumbnailKey string `gorm:"size:500" json:"thumbnail_key,omitempty"` // MinIO key for scaled thumbnail (0.25x)
	Width        int    `gorm:"not null" json:"width"`                   // Original image width in pixels
	Height       int    `gorm:"not null" json:"height"`                  // Original image height in pixels
	Visibility      string         `gorm:"size:20;not null;default:'private';index" json:"visibility"` // 'public' or 'private'
	LikesCount   int            `gorm:"not null;default:0" json:"likes_count"`
	CreatedAt    time.Time      `gorm:"not null;default:now();index:idx_images_created_at" json:"created_at"`
	UpdatedAt    time.Time      `gorm:"not null;default:now()" json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	User  User   `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
	Likes []Like `gorm:"foreignKey:ImageID;constraint:OnDelete:CASCADE" json:"likes,omitempty"`
}

// TableName specifies the table name for the Image model
func (Image) TableName() string {
	return "images"
}

// Visibility constants
const (
	VisibilityPublic  = "public"
	VisibilityPrivate = "private"
)
