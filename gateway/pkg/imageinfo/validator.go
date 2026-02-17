package imageinfo

import (
	"fmt"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"strings"

	"github.com/safina57/animoji/gateway/internal/constants"
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

// ValidateDimensions returns an error if the image dimensions are outside the acceptable range.
func (v *ImageValidator) ValidateDimensions(width, height int) error {
	if width < constants.MinImageWidth || height < constants.MinImageHeight {
		return fmt.Errorf("image too small: %dx%d (minimum: %dx%d)",
			width, height, constants.MinImageWidth, constants.MinImageHeight)
	}
	if width > constants.MaxImageWidth || height > constants.MaxImageHeight {
		return fmt.Errorf("image too large: %dx%d (maximum: %dx%d)",
			width, height, constants.MaxImageWidth, constants.MaxImageHeight)
	}
	return nil
}

// ClampDimensions proportionally scales image dimensions to fit within [MinImageWidth/Height, MaxImageWidth/Height].
func (v *ImageValidator) ClampDimensions(width, height int) (int, int) {
	w, h := float64(width), float64(height)

	if width > constants.MaxImageWidth || height > constants.MaxImageHeight {
		scale := math.Min(
			float64(constants.MaxImageWidth)/w,
			float64(constants.MaxImageHeight)/h,
		)
		w, h = w*scale, h*scale
	}

	if int(math.Round(w)) < constants.MinImageWidth || int(math.Round(h)) < constants.MinImageHeight {
		scale := math.Max(
			float64(constants.MinImageWidth)/w,
			float64(constants.MinImageHeight)/h,
		)
		w, h = w*scale, h*scale
	}

	return roundToMultiple8(int(math.Round(w))), roundToMultiple8(int(math.Round(h)))
}

// roundToMultiple8 rounds n to the nearest multiple of 8.
func roundToMultiple8(n int) int {
	return ((n + 4) / 8) * 8
}
