package imageinfo

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// Validator handles image validation logic
type Validator struct {
	config ValidationConfig
}

// NewValidator creates a new validator with the given config
func NewValidator(config ValidationConfig) *Validator {
	return &Validator{config: config}
}

// ValidateFile performs all validation checks on a file
func (v *Validator) ValidateFile(path string) error {
	// Check file exists
	stat, err := os.Stat(path)
	if err != nil {
		if os.IsNotExist(err) {
			return ErrFileNotFound
		}
		return fmt.Errorf("cannot stat file: %w", err)
	}

	// Check it's not a directory
	if stat.IsDir() {
		return ErrIsDirectory
	}

	// Check file size
	if err := v.validateSize(stat.Size()); err != nil {
		return err
	}

	// Check extension
	if err := v.validateExtension(path); err != nil {
		return err
	}

	return nil
}

// validateSize checks if file size is within limits
func (v *Validator) validateSize(size int64) error {
	if size > v.config.MaxSizeBytes {
		return fmt.Errorf("%w: %d bytes (max: %d bytes)",
			ErrFileTooLarge, size, v.config.MaxSizeBytes)
	}
	return nil
}

// validateExtension checks if file extension is allowed
func (v *Validator) validateExtension(path string) error {
	ext := strings.ToLower(strings.TrimPrefix(filepath.Ext(path), "."))

	for _, allowed := range v.config.AllowedExtensions {
		if ext == strings.ToLower(allowed) {
			return nil
		}
	}

	return fmt.Errorf("%w: .%s (allowed: %v)",
		ErrInvalidExtension, ext, v.config.AllowedExtensions)
}

// ValidateMIMEType checks if MIME type is allowed
func (v *Validator) ValidateMIMEType(mimeType string) error {
	for _, allowed := range v.config.AllowedMIMETypes {
		if mimeType == allowed {
			return nil
		}
	}

	return fmt.Errorf("%w: %s (allowed: %v)",
		ErrInvalidMIMEType, mimeType, v.config.AllowedMIMETypes)
}
