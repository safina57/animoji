package models

import (
	"time"

	"github.com/google/uuid"
)

// EmojiPack represents a published set of emoji variants for a job.
type EmojiPack struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	JobID     string    `gorm:"uniqueIndex;not null" json:"job_id"`
	CreatedAt time.Time `gorm:"not null;default:now()" json:"created_at"`

	// Relationships
	User     User           `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
	Variants []EmojiVariant `gorm:"foreignKey:PackID;constraint:OnDelete:CASCADE" json:"variants,omitempty"`
}

func (EmojiPack) TableName() string { return "emoji_packs" }

// EmojiVariant represents a single published emoji variant (one emotion) within a pack.
type EmojiVariant struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PackID    uuid.UUID `gorm:"type:uuid;not null;index" json:"pack_id"`
	Emotion   string    `gorm:"size:50;not null" json:"emotion"`
	ResultKey string    `gorm:"size:500;not null" json:"result_key"`
	CreatedAt time.Time `gorm:"not null;default:now()" json:"created_at"`
}

func (EmojiVariant) TableName() string { return "emoji_variants" }
