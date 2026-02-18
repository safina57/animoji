package storage

import (
	"context"
	"fmt"
	"os"
	"sync"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/pkg/logger"
)

var (
	instance *MinIOClient
	once     sync.Once
	initErr  error
)

// GetClient returns the singleton MinIO client instance
func GetClient() (*MinIOClient, error) {
	once.Do(func() {
		ctx := context.Background()
		instance, initErr = initializeClient(ctx)
	})
	return instance, initErr
}

// MustGetClient returns the singleton MinIO client or panics if initialization failed
func MustGetClient() *MinIOClient {
	client, err := GetClient()
	if err != nil {
		logger.Fatal().Err(err).Msg("Failed to get MinIO client")
	}
	return client
}

// initializeClient creates and configures the MinIO client
func initializeClient(ctx context.Context) (*MinIOClient, error) {
	endpoint := os.Getenv("MINIO_ENDPOINT")
	accessKey := os.Getenv("MINIO_ACCESS_KEY")
	secretKey := os.Getenv("MINIO_SECRET_KEY")
	publicURL := os.Getenv("MINIO_PUBLIC_URL")

	if endpoint == "" || accessKey == "" || secretKey == "" {
		return nil, fmt.Errorf("missing required MinIO environment variables")
	}

	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: false,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to initialize MinIO client: %w", err)
	}

	internalBaseURL := "http://" + endpoint
	publicBaseURL := publicURL

	client := &MinIOClient{
		client:          minioClient,
		internalBaseURL: internalBaseURL,
		publicBaseURL:   publicBaseURL,
	}

	if err := client.EnsureBucket(ctx, constants.BucketName); err != nil {
		return nil, err
	}

	// Configure ILM to auto-expire tmp/ objects after 24h
	if err := client.SetupBucketLifecycle(ctx, constants.BucketName); err != nil {
		return nil, fmt.Errorf("failed to configure bucket lifecycle: %w", err)
	}

	logger.Info().
		Str("bucket", constants.BucketName).
		Msg("MinIO client initialized")

	return client, nil
}
