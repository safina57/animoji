package storage

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
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

// UploadTmpOriginal uploads a validated original image to the tmp/ prefix
// Returns the object key stored in MinIO
func (s *MinIOService) UploadTmpOriginal(ctx context.Context, jobID string, data []byte, ext string, mimeType string) (string, error) {
	objectKey := fmt.Sprintf("%s%s/original.%s", constants.PrefixTmp, jobID, ext)
	if err := s.client.UploadFile(ctx, constants.BucketName, objectKey, data, mimeType); err != nil {
		return "", fmt.Errorf("failed to upload tmp original: %w", err)
	}
	return objectKey, nil
}

// CheckTmpResultExists checks if a tmp result image exists for a job at a given iteration
func (s *MinIOService) CheckTmpResultExists(ctx context.Context, jobID string, iterationNum int) (bool, error) {
	objectKey := fmt.Sprintf("%s%s/result_v%d.png", constants.PrefixTmp, jobID, iterationNum)
	return s.client.ObjectExists(ctx, constants.BucketName, objectKey)
}

// GetPresignedURLForKey generates a presigned URL for any arbitrary object key
func (s *MinIOService) GetPresignedURLForKey(ctx context.Context, objectKey string, expiry time.Duration) (string, error) {
	return s.client.GetPresignedURL(ctx, constants.BucketName, objectKey, expiry)
}

// PublishFiles copies the tmp original and tmp result to their permanent published paths.
func (s *MinIOService) PublishFiles(
	ctx context.Context,
	jobID string,
	imageID uuid.UUID,
	originalExt string,
	iterationNum int,
	visibility string,
) (string, string, error) {
	prefix := constants.ImagePrefix(visibility)

	imageIDStr := imageID.String()

	srcOriginalKey := fmt.Sprintf("%s%s/original.%s", constants.PrefixTmp, jobID, originalExt)
	srcResultKey := fmt.Sprintf("%s%s/result_v%d.png", constants.PrefixTmp, jobID, iterationNum)

	dstOriginalKey := fmt.Sprintf("%s%s/original.%s", prefix, imageIDStr, originalExt)
	dstResultKey := fmt.Sprintf("%s%s/result.png", prefix, imageIDStr)

	if err := s.client.CopyObject(ctx, constants.BucketName, srcOriginalKey, dstOriginalKey); err != nil {
		return "", "", fmt.Errorf("failed to copy original to permanent storage: %w", err)
	}

	if err := s.client.CopyObject(ctx, constants.BucketName, srcResultKey, dstResultKey); err != nil {
		// Best-effort rollback of the already-copied original — non-blocking
		go func(key string) {
			_ = s.client.DeleteObject(context.Background(), constants.BucketName, key)
		}(dstOriginalKey)
		return "", "", fmt.Errorf("failed to copy result to permanent storage: %w", err)
	}

	return dstOriginalKey, dstResultKey, nil
}

// DownloadFile downloads a file from MinIO using the object key
func (s *MinIOService) DownloadFile(ctx context.Context, objectKey string) ([]byte, error) {
	return s.client.DownloadFile(ctx, constants.BucketName, objectKey)
}

// UploadFile uploads a file to MinIO using the object key
func (s *MinIOService) UploadFile(ctx context.Context, objectKey string, data []byte, contentType string) error {
	return s.client.UploadFile(ctx, constants.BucketName, objectKey, data, contentType)
}

// DeleteObject removes an object from the bucket by key
func (s *MinIOService) DeleteObject(ctx context.Context, objectKey string) error {
	return s.client.DeleteObject(ctx, constants.BucketName, objectKey)
}
