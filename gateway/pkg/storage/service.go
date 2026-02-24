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

// UploadTmpEmojiOriginal uploads the reference image for an emoji job to the tmp/ prefix.
// Returns the object key stored in MinIO.
func (s *MinIOService) UploadTmpEmojiOriginal(ctx context.Context, jobID string, data []byte, ext string, mimeType string) (string, error) {
	objectKey := fmt.Sprintf("%s%s/emoji_original.%s", constants.PrefixTmp, jobID, ext)
	if err := s.client.UploadFile(ctx, constants.BucketName, objectKey, data, mimeType); err != nil {
		return "", fmt.Errorf("failed to upload tmp emoji original: %w", err)
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

// PublishEmojiFiles copies each completed emoji variant from tmp/ to its permanent
// public location. Returns a map of emotion → permanent result key.
func (s *MinIOService) PublishEmojiFiles(
	ctx context.Context,
	jobID string,
	packID uuid.UUID,
	emotions []string,
) (map[string]string, error) {
	packIDStr := packID.String()
	resultKeys := make(map[string]string, len(emotions))
	var copied []string

	for _, emotion := range emotions {
		srcKey := fmt.Sprintf("%s%s/emoji_%s.png", constants.PrefixTmp, jobID, emotion)
		dstKey := fmt.Sprintf("%s%s/emoji_%s.png", constants.PrefixEmojisPublic, packIDStr, emotion)

		if err := s.client.CopyObject(ctx, constants.BucketName, srcKey, dstKey); err != nil {
			// Best-effort rollback of already-copied variants
			go func(keys []string) {
				for _, k := range keys {
					_ = s.client.DeleteObject(context.Background(), constants.BucketName, k)
				}
			}(append([]string{}, copied...))
			return nil, fmt.Errorf("failed to copy emoji variant %q: %w", emotion, err)
		}

		resultKeys[emotion] = dstKey
		copied = append(copied, dstKey)
	}

	return resultKeys, nil
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

// GetPublicURL returns the public URL for a given object key in the default bucket
func (s *MinIOService) GetPublicURL(objectKey string) string {
	return s.client.GetPublicURL(constants.BucketName, objectKey)
}

// GetURLForKey returns the appropriate URL for an object key.
// Keys under a private prefix get a time-limited presigned URL;
// all other keys get a plain public URL.
func (s *MinIOService) GetURLForKey(ctx context.Context, objectKey string) (string, error) {
	if constants.IsPrivateKey(objectKey) {
		return s.client.GetPresignedURL(ctx, constants.BucketName, objectKey, constants.PresignedURLExpiry)
	}
	return s.client.GetPublicURL(constants.BucketName, objectKey), nil
}
