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

	"github.com/dustin/go-humanize"
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
		ReadableSize: humanize.Bytes(uint64(stat.Size())),
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

// ExtractFromData gets all metadata from buffered image data
func (e *ImageMetadataExtractor) ExtractFromData(data []byte, filename string, size int64) (*ImageInfo, error) {
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
		ReadableSize: humanize.Bytes(uint64(size)),
		Width:        width,
		Height:       height,
		MIMEType:     mimeType,
		Data:         data,
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
