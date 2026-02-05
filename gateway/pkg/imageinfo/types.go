package imageinfo

import (
	"errors"

	"github.com/safina57/animoji/gateway/internal/constants"
)

// ImageInfo holds complete metadata about an image file
type ImageInfo struct {
	Filename     string `json:"filename"`
	SizeBytes    int64  `json:"size_bytes"`
	Extension    string `json:"extension"`
	ReadableSize string `json:"readable_size"`
	Width        int    `json:"width"`
	Height       int    `json:"height"`
	MIMEType     string `json:"mime_type"`
	Data         []byte `json:"-"`
}

// ClearData releases the buffered image data from memory
func (i *ImageInfo) ClearData() {
	i.Data = nil
}

// ValidationConfig holds validation rules
type ValidationConfig struct {
	MaxSizeBytes      int64
	AllowedExtensions []string
	AllowedMIMETypes  []string
}

// Common validation errors
var (
	ErrFileNotFound      = errors.New("file not found")
	ErrIsDirectory       = errors.New("path is a directory, not a file")
	ErrFileTooLarge      = errors.New("file exceeds maximum size")
	ErrInvalidExtension  = errors.New("file extension not allowed")
	ErrInvalidMIMEType   = errors.New("MIME type not allowed")
	ErrCannotDecodeImage = errors.New("cannot decode image (corrupted or invalid format)")
)

// DefaultConfig returns sensible defaults for image validation
func DefaultConfig() ValidationConfig {
	return ValidationConfig{
		MaxSizeBytes:      constants.MaxUploadSize,
		AllowedExtensions: constants.AllowedImageExtensions,
		AllowedMIMETypes:  constants.AllowedImageMIMETypes,
	}
}
