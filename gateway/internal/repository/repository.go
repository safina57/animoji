package repository

import (
	"gorm.io/gorm"
)

// Repository provides access to database operations
type Repository struct {
	db *gorm.DB
}

// NewRepository creates a new repository instance
func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// GetDB returns the underlying GORM database instance
func (r *Repository) GetDB() *gorm.DB {
	return r.db
}
