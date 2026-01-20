package imageinfo

import (
	"slices"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// ImageValidator handles image validation logic
type ImageValidator struct {
	config ValidationConfig
}

// NewImageValidator creates a new image validator with the given config
func NewImageValidator(config ValidationConfig) *ImageValidator {
	return &ImageValidator{config: config}
}

// ValidateFile performs all validation checks on a file
func (v *ImageValidator) ValidateFile(path string) error {
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
func (v *ImageValidator) validateSize(size int64) error {
	if size > v.config.MaxSizeBytes {
		return fmt.Errorf("%w: %d bytes (max: %d bytes)",
			ErrFileTooLarge, size, v.config.MaxSizeBytes)
	}
	return nil
}

// validateExtension checks if file extension is allowed
func (v *ImageValidator) validateExtension(path string) error {
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
func (v *ImageValidator) ValidateMIMEType(mimeType string) error {
	if slices.Contains(v.config.AllowedMIMETypes, mimeType) {
			return nil
		}

	return fmt.Errorf("%w: %s (allowed: %v)",
		ErrInvalidMIMEType, mimeType, v.config.AllowedMIMETypes)
}

// ValidateBufferedContent performs complete validation on buffered data
// This validates size, extension, MIME type, and ensures the data is a valid image
func (v *ImageValidator) ValidateBufferedContent(data []byte, filename string, size int64) error {
	// Check file size
	if err := v.validateSize(size); err != nil {
		return err
	}

	// Check extension from filename
	if err := v.validateExtension(filename); err != nil {
		return err
	}

	// Detect actual MIME type from content (not just filename)
	mimeType := detectMIMETypeFromData(data)
	if err := v.ValidateMIMEType(mimeType); err != nil {
		return err
	}

	return nil
}

// detectMIMETypeFromData detects MIME type from raw bytes
func detectMIMETypeFromData(data []byte) string {
	// http.DetectContentType reads at most first 512 bytes
	size := min(len(data), 512)
	return http.DetectContentType(data[:size])
}
