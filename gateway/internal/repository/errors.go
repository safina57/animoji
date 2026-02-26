package repository

import (
	"errors"
	"fmt"

	"gorm.io/gorm"
)

// Custom error types for better error handling
var (
	ErrNotFound            = errors.New("record not found")
	ErrDuplicateKey        = errors.New("duplicate key violation")
	ErrForeignKeyViolation = errors.New("foreign key constraint violation")
	ErrInvalidInput        = errors.New("invalid input")
)

// NotFoundError represents a specific record not found error
type NotFoundError struct {
	Resource string
	ID       string
}

func (e *NotFoundError) Error() string {
	return fmt.Sprintf("%s not found: %s", e.Resource, e.ID)
}

func (e *NotFoundError) Is(target error) bool {
	return target == ErrNotFound
}

// NewNotFoundError creates a new NotFoundError
func NewNotFoundError(resource, id string) error {
	return &NotFoundError{
		Resource: resource,
		ID:       id,
	}
}

// WrapDBError wraps GORM errors into custom error types
func WrapDBError(err error, resource string) error {
	if err == nil {
		return nil
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return &NotFoundError{
			Resource: resource,
			ID:       "unknown",
		}
	}

	// You can add more GORM error mappings here
	// For example: gorm.ErrDuplicatedKey, gorm.ErrForeignKeyViolated, etc.

	return fmt.Errorf("database error for %s: %w", resource, err)
}

// IsNotFoundError checks if an error is a NotFoundError
func IsNotFoundError(err error) bool {
	var notFoundErr *NotFoundError
	return errors.As(err, &notFoundErr)
}
