package thumbnail

import (
	"bytes"
	"context"
	"fmt"
	"image"
	"image/png"

	"github.com/disintegration/imaging"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/pkg/logger"
	"github.com/safina57/animoji/gateway/pkg/storage"
)

// ThumbnailService handles thumbnail generation and storage
type ThumbnailService struct {
	storage *storage.MinIOService
}

// NewThumbnailService creates a new thumbnail service
func NewThumbnailService(storage *storage.MinIOService) *ThumbnailService {
	return &ThumbnailService{
		storage: storage,
	}
}

// GenerateThumbnail downloads an image, creates a scaled thumbnail, and uploads it to MinIO
func (s *ThumbnailService) GenerateThumbnail(
	ctx context.Context,
	jobID string,
	generatedKey string,
) (string, error) {
	// Download the generated image from MinIO
	imageData, err := s.storage.DownloadFile(ctx, generatedKey)
	if err != nil {
		return "", fmt.Errorf("failed to download image for thumbnail generation: %w", err)
	}

	// Decode the image
	img, _, err := image.Decode(bytes.NewReader(imageData))
	if err != nil {
		return "", fmt.Errorf("failed to decode image: %w", err)
	}

	// Calculate new dimensions (scale by factor, preserving aspect ratio)
	bounds := img.Bounds()
	originalWidth := bounds.Dx()
	originalHeight := bounds.Dy()
	newWidth := int(float64(originalWidth) * constants.ThumbnailScaleFactor)
	newHeight := int(float64(originalHeight) * constants.ThumbnailScaleFactor)

	// Ensure minimum dimensions of 1px
	if newWidth < 1 {
		newWidth = 1
	}
	if newHeight < 1 {
		newHeight = 1
	}

	// Resize image maintaining aspect ratio
	thumbnail := imaging.Resize(img, newWidth, newHeight, imaging.Lanczos)

	// Encode to PNG
	var buf bytes.Buffer
	if err := png.Encode(&buf, thumbnail); err != nil {
		return "", fmt.Errorf("failed to encode thumbnail: %w", err)
	}

	// Upload to MinIO
	key := fmt.Sprintf("%s%s/thumbnail.png", constants.PrefixThumbnails, jobID)
	if err := s.storage.UploadFile(ctx, key, buf.Bytes(), "image/png"); err != nil {
		return "", fmt.Errorf("failed to upload thumbnail: %w", err)
	}

	logger.Info().
		Str("job_id", jobID).
		Str("key", key).
		Int("original_width", originalWidth).
		Int("original_height", originalHeight).
		Int("thumbnail_width", newWidth).
		Int("thumbnail_height", newHeight).
		Msg("Thumbnail generated and uploaded")

	return key, nil
}
