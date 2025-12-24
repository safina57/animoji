package imageinfo

import (
	"bytes"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"os"
	"path/filepath"

	_ "golang.org/x/image/webp"
)

// ImageMetadataExtractor extracts image metadata
type ImageMetadataExtractor struct{}

// NewImageMetadataExtractor creates a new image metadata extractor
func NewImageMetadataExtractor() *ImageMetadataExtractor {
	return &ImageMetadataExtractor{}
}

// Extract gets all metadata from an image file
func (e *ImageMetadataExtractor) Extract(path string) (*ImageInfo, error) {
	stat, err := os.Stat(path)
	if err != nil {
		return nil, fmt.Errorf("cannot stat file: %w", err)
	}

	// Get MIME type
	mimeType, err := e.detectMIMEType(path)
	if err != nil {
		return nil, fmt.Errorf("cannot detect MIME type: %w", err)
	}

	// Get dimensions
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("cannot open file: %w", err)
	}
	defer file.Close()

	width, height, err := e.getDimensionsFromReader(file)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrCannotDecodeImage, err)
	}

	ext := filepath.Ext(path)
	if len(ext) > 0 {
		ext = ext[1:] // Remove leading dot
	}

	return &ImageInfo{
		Filename:     stat.Name(),
		SizeBytes:    stat.Size(),
		Extension:    ext,
		ReadableSize: formatBytes(stat.Size()),
		Width:        width,
		Height:       height,
		MIMEType:     mimeType,
	}, nil
}

// detectMIMEType uses the first 512 bytes to detect content type
func (e *ImageMetadataExtractor) detectMIMEType(path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	// Read first 512 bytes for MIME detection
	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil {
		return "", err
	}

	return http.DetectContentType(buffer[:n]), nil
}

// formatBytes converts bytes to human-readable format
func formatBytes(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.2f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}

// ExtractFromReader gets all metadata from an io.Reader
func (e *ImageMetadataExtractor) ExtractFromReader(r io.Reader, filename string, size int64) (*ImageInfo, error) {
	// Read all data into memory
	data, err := io.ReadAll(r)
	if err != nil {
		return nil, fmt.Errorf("cannot read data: %w", err)
	}

	// Get MIME type from data
	mimeType := http.DetectContentType(data)

	// Get dimensions by decoding image
	width, height, err := e.getDimensionsFromReader(bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrCannotDecodeImage, err)
	}

	ext := filepath.Ext(filename)
	if len(ext) > 0 {
		ext = ext[1:] // Remove leading dot
	}

	return &ImageInfo{
		Filename:     filename,
		SizeBytes:    size,
		Extension:    ext,
		ReadableSize: formatBytes(size),
		Width:        width,
		Height:       height,
		MIMEType:     mimeType,
	}, nil
}

// getDimensionsFromReader decodes the image from a reader to get width and height
func (e *ImageMetadataExtractor) getDimensionsFromReader(r io.Reader) (int, int, error) {
	config, _, err := image.DecodeConfig(r)
	if err != nil {
		return 0, 0, err
	}

	return config.Width, config.Height, nil
}
