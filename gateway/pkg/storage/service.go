package storage

import (
	"context"
	"fmt"
	"path/filepath"

	"github.com/safina57/animoji/gateway/internal/constants"
)

type MinIOService struct {
	client *MinIOClient
}

func NewMinIOService() *MinIOService {
	return &MinIOService{
		client: MustGetClient(),
	}
}

// UploadOriginalImage uploads a validated original image to the originals/ prefix
// Returns the object key (path) in MinIO
func (s *MinIOService) UploadOriginalImage(ctx context.Context, jobID string, data []byte, filename string, mimeType string) (string, error) {
	// Determine file extension
	ext := filepath.Ext(filename)

	// Construct object key: originals/{job_id}/input.{ext}
	objectKey := fmt.Sprintf("%s%s/input%s", constants.PrefixOriginals, jobID, ext)

	// Upload to MinIO
	if err := s.client.UploadFile(ctx, constants.BucketName, objectKey, data, mimeType); err != nil {
		return "", fmt.Errorf("failed to upload original image: %w", err)
	}

	return objectKey, nil
}

