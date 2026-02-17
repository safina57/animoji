package storage

import (
	"context"
	"fmt"
	"path/filepath"
	"time"

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

// CheckResultExists checks if a result image exists for a job (latest iteration)
func (s *MinIOService) CheckResultExists(ctx context.Context, jobID string, iterationNum int) (bool, error) {
	objectKey := fmt.Sprintf("%s%s/result_v%d.png", constants.PrefixGenerated, jobID, iterationNum)
	return s.client.ObjectExists(ctx, constants.BucketName, objectKey)
}

// GetPresignedURLForOriginal generates a presigned URL for the original image
func (s *MinIOService) GetPresignedURLForOriginal(ctx context.Context, jobID string, expiry time.Duration) (string, error) {
	// Find the extension by listing objects in the original's prefix
	prefix := fmt.Sprintf("%s%s/", constants.PrefixOriginals, jobID)
	objectCh := s.client.ListObjects(ctx, constants.BucketName, prefix)

	object, ok := <-objectCh
	if !ok {
		return "", fmt.Errorf("original not found for job %s", jobID)
	}
	if object.Err != nil {
		return "", fmt.Errorf("failed to list objects: %w", object.Err)
	}

	ext := filepath.Ext(object.Key)
	objectKey := fmt.Sprintf("%s%s/input%s", constants.PrefixOriginals, jobID, ext)
	return s.client.GetPresignedURL(ctx, constants.BucketName, objectKey, expiry)
}

// GetPresignedURLForResult generates a presigned URL for the result image
func (s *MinIOService) GetPresignedURLForResult(ctx context.Context, jobID string, iterationNum int, expiry time.Duration) (string, error) {
	objectKey := fmt.Sprintf("%s%s/result_v%d.png", constants.PrefixGenerated, jobID, iterationNum)
	return s.client.GetPresignedURL(ctx, constants.BucketName, objectKey, expiry)
}

// DownloadFile downloads a file from MinIO using the object key
func (s *MinIOService) DownloadFile(ctx context.Context, objectKey string) ([]byte, error) {
	return s.client.DownloadFile(ctx, constants.BucketName, objectKey)
}

// UploadFile uploads a file to MinIO using the object key
func (s *MinIOService) UploadFile(ctx context.Context, objectKey string, data []byte, contentType string) error {
	return s.client.UploadFile(ctx, constants.BucketName, objectKey, data, contentType)
}
