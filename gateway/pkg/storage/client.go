package storage

import (
	"context"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/minio/minio-go/v7"
)

// MinIOClient wraps the MinIO client with low-level storage operations
type MinIOClient struct {
	client          *minio.Client
	internalBaseURL string
	publicBaseURL   string
}

// EnsureBucket checks if the specified bucket exists
func (c *MinIOClient) EnsureBucket(ctx context.Context, bucketName string) error {
	exists, err := c.client.BucketExists(ctx, bucketName)
	if err != nil {
		return fmt.Errorf("failed to check bucket existence: %w", err)
	}
	if !exists {
		return fmt.Errorf("bucket '%s' does not exist", bucketName)
	}
	return nil
}

// UploadFile uploads a file to the specified bucket and object key
func (c *MinIOClient) UploadFile(ctx context.Context, bucketName, objectKey string, data []byte, contentType string) error {
	_, err := c.client.PutObject(ctx, bucketName, objectKey, NewBytesReader(data), int64(len(data)), minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return fmt.Errorf("failed to upload object: %w", err)
	}
	return nil
}

// DownloadFile downloads a file from the specified bucket and object key
func (c *MinIOClient) DownloadFile(ctx context.Context, bucketName, objectKey string) ([]byte, error) {
	object, err := c.client.GetObject(ctx, bucketName, objectKey, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get object: %w", err)
	}
	defer object.Close()

	// Read all data into memory
	data, err := io.ReadAll(object)
	if err != nil {
		return nil, fmt.Errorf("failed to read object data: %w", err)
	}

	return data, nil
}

// ObjectExists checks if an object exists in MinIO
func (c *MinIOClient) ObjectExists(ctx context.Context, bucketName, objectKey string) (bool, error) {
	_, err := c.client.StatObject(ctx, bucketName, objectKey, minio.StatObjectOptions{})
	if err != nil {
		if minio.ToErrorResponse(err).Code == "NoSuchKey" {
			return false, nil
		}
		return false, fmt.Errorf("failed to check object existence: %w", err)
	}
	return true, nil
}

// GetPresignedURL generates a presigned GET URL using public client
func (c *MinIOClient) GetPresignedURL(ctx context.Context, bucketName, objectKey string, expiry time.Duration) (string, error) {
	url, err := c.client.PresignedGetObject(ctx, bucketName, objectKey, expiry, nil)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	presignedURL := url.String()

	// Replace internal endpoint with public URL
	presignedURL = strings.Replace(presignedURL, c.internalBaseURL, c.publicBaseURL, 1)

	return presignedURL, nil
}

// ListObjects lists objects with a given prefix
func (c *MinIOClient) ListObjects(ctx context.Context, bucketName, prefix string) <-chan minio.ObjectInfo {
	return c.client.ListObjects(ctx, bucketName, minio.ListObjectsOptions{
		Prefix:    prefix,
		Recursive: true,
	})
}

// CopyObject copies an object within the same bucket
func (c *MinIOClient) CopyObject(ctx context.Context, bucketName, srcKey, dstKey string) error {
	_, err := c.client.CopyObject(ctx,
		minio.CopyDestOptions{
			Bucket: bucketName,
			Object: dstKey,
		},
		minio.CopySrcOptions{
			Bucket: bucketName,
			Object: srcKey,
		},
	)
	if err != nil {
		return fmt.Errorf("failed to copy object from %s to %s: %w", srcKey, dstKey, err)
	}
	return nil
}

// DeleteObject removes an object from MinIO
func (c *MinIOClient) DeleteObject(ctx context.Context, bucketName, objectKey string) error {
	if err := c.client.RemoveObject(ctx, bucketName, objectKey, minio.RemoveObjectOptions{}); err != nil {
		return fmt.Errorf("failed to delete object %s: %w", objectKey, err)
	}
	return nil
}

// GetPublicURL returns the public URL for a given bucket and object key
func (c *MinIOClient) GetPublicURL(bucketName, objectKey string) string {
	return fmt.Sprintf("%s/%s/%s", c.publicBaseURL, bucketName, objectKey)
}


