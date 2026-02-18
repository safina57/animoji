package thumbnail

import (
	"bytes"
	"context"
	"fmt"
	"image"
	"image/png"

	"github.com/disintegration/imaging"
	"github.com/google/uuid"
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

// GenerateThumbnail downloads a generated image, creates a scaled thumbnail, and uploads it.
// The thumbnail is stored at thumbnails/{visibility}/{image_id}/thumbnail.png.
func (s *ThumbnailService) GenerateThumbnail(
	ctx context.Context,
	imageID uuid.UUID,
	visibility string,
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

	// Upload thumbnail keyed by image UUID under the correct visibility prefix
	key := fmt.Sprintf("%s%s/thumbnail.png", constants.ThumbnailPrefix(visibility), imageID.String())
	if err := s.storage.UploadFile(ctx, key, buf.Bytes(), "image/png"); err != nil {
		return "", fmt.Errorf("failed to upload thumbnail: %w", err)
	}

	logger.Info().
		Str("image_id", imageID.String()).
		Str("visibility", visibility).
		Str("key", key).
		Int("original_width", originalWidth).
		Int("original_height", originalHeight).
		Int("thumbnail_width", newWidth).
		Int("thumbnail_height", newHeight).
		Msg("Thumbnail generated and uploaded")

	return key, nil
}
