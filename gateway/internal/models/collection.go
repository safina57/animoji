package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Collection represents a user-created gallery/collection
type Collection struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	Name        string    `gorm:"size:255;not null" json:"name"`
	Description *string   `gorm:"type:text" json:"description,omitempty"`
	IsPublic    bool      `gorm:"not null;default:false" json:"is_public"`
	CreatedAt   time.Time `gorm:"not null;default:now()" json:"created_at"`
	UpdatedAt   time.Time `gorm:"not null;default:now()" json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	User            User              `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
	CollectionItems []CollectionItem  `gorm:"foreignKey:CollectionID;constraint:OnDelete:CASCADE" json:"items,omitempty"`
}

// TableName specifies the table name for the Collection model
func (Collection) TableName() string {
	return "collections"
}

// CollectionItem represents the many-to-many relationship between collections and images
type CollectionItem struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CollectionID uuid.UUID `gorm:"type:uuid;not null;index:idx_collection_items_collection;uniqueIndex:idx_collection_image_unique" json:"collection_id"`
	ImageID      uuid.UUID `gorm:"type:uuid;not null;index:idx_collection_items_image;uniqueIndex:idx_collection_image_unique" json:"image_id"`
	AddedAt      time.Time `gorm:"not null;default:now()" json:"added_at"`

	// Relationships
	Collection Collection `gorm:"foreignKey:CollectionID;constraint:OnDelete:CASCADE" json:"collection,omitempty"`
	Image      Image      `gorm:"foreignKey:ImageID;constraint:OnDelete:CASCADE" json:"image,omitempty"`
}

// TableName specifies the table name for the CollectionItem model
func (CollectionItem) TableName() string {
	return "collection_items"
}
