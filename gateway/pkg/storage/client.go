package storage

import (
	"context"
	"fmt"

	"github.com/minio/minio-go/v7"
)

// MinIOClient wraps the MinIO client with low-level storage operations
type MinIOClient struct {
	minio *minio.Client
}

// EnsureBucket checks if the specified bucket exists
func (c *MinIOClient) EnsureBucket(ctx context.Context, bucketName string) error {
	exists, err := c.minio.BucketExists(ctx, bucketName)
	if err != nil {
		return fmt.Errorf("failed to check bucket existence: %w", err)
	}

	if !exists {
		return fmt.Errorf("bucket '%s' does not exist - please create it before starting the gateway", bucketName)
	}

	return nil
}

// UploadFile uploads a file to the specified bucket and object key
func (c *MinIOClient) UploadFile(ctx context.Context, bucketName string, objectKey string, data []byte, contentType string) error {
	info, err := c.minio.PutObject(
		ctx,
		bucketName,
		objectKey,
		NewBytesReader(data),
		int64(len(data)),
		minio.PutObjectOptions{
			ContentType: contentType,
		},
	)
	if err != nil {
		return fmt.Errorf("failed to upload object: %w", err)
	}

	// Verify upload
	if info.Size != int64(len(data)) {
		return fmt.Errorf("upload size mismatch: expected %d bytes, uploaded %d bytes", len(data), info.Size)
	}

	return nil
}
