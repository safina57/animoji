package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/pkg/logger"
)

// JobMetadata represents temporary job data cached in Redis
type JobMetadata struct {
	JobID        string    `json:"job_id"`
	UserID       uuid.UUID `json:"user_id"`
	Prompt       string    `json:"prompt"`
	OriginalKey  string    `json:"original_key"`
	GeneratedKey string    `json:"generated_key,omitempty"`
	Width        int       `json:"width"`
	Height       int       `json:"height"`
	CreatedAt    time.Time `json:"created_at"`
}

// RedisClient wraps the Redis client with job metadata operations
type RedisClient struct {
	client *redis.Client
	ttl    time.Duration
}

var (
	redisClientInstance *RedisClient
	redisClientOnce     sync.Once
)

// NewRedisClient creates a new Redis client instance
func NewRedisClient() *RedisClient {
	// Read Redis configuration from environment
	host := os.Getenv("REDIS_HOST")
	port := os.Getenv("REDIS_PORT")
	password := os.Getenv("REDIS_PASSWORD")

	client := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", host, port),
		Password: password,
		DB:       constants.RedisDB,
	})

	return &RedisClient{
		client: client,
		ttl:    constants.RedisTTL,
	}
}

// MustGetClient returns the singleton Redis client instance
func MustGetClient() *RedisClient {
	redisClientOnce.Do(func() {
		redisClientInstance = NewRedisClient()

		// Test connection
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := redisClientInstance.client.Ping(ctx).Err(); err != nil {
			logger.Error().Err(err).Msg("Failed to connect to Redis")
			panic(fmt.Sprintf("Redis connection failed: %v", err))
		}

		logger.Info().
			Str("addr", redisClientInstance.client.Options().Addr).
			Msg("Redis client initialized successfully")
	})

	return redisClientInstance
}

// jobKey returns the Redis key for a job ID
func (r *RedisClient) jobKey(jobID string) string {
	return fmt.Sprintf("job:%s", jobID)
}

// SetJobMetadata stores job metadata in Redis with TTL
func (r *RedisClient) SetJobMetadata(ctx context.Context, jobID string, metadata *JobMetadata) error {
	key := r.jobKey(jobID)

	// Serialize metadata to JSON
	data, err := json.Marshal(metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal job metadata: %w", err)
	}

	// Store in Redis with TTL
	if err := r.client.Set(ctx, key, data, r.ttl).Err(); err != nil {
		return fmt.Errorf("failed to set job metadata in Redis: %w", err)
	}

	logger.Debug().
		Str("job_id", jobID).
		Dur("ttl", r.ttl).
		Msg("Job metadata cached in Redis")

	return nil
}

// GetJobMetadata retrieves job metadata from Redis
func (r *RedisClient) GetJobMetadata(ctx context.Context, jobID string) (*JobMetadata, error) {
	key := r.jobKey(jobID)

	// Get data from Redis
	data, err := r.client.Get(ctx, key).Bytes()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("job metadata not found: %s", jobID)
		}
		return nil, fmt.Errorf("failed to get job metadata from Redis: %w", err)
	}

	// Deserialize JSON
	var metadata JobMetadata
	if err := json.Unmarshal(data, &metadata); err != nil {
		return nil, fmt.Errorf("failed to unmarshal job metadata: %w", err)
	}

	logger.Debug().
		Str("job_id", jobID).
		Msg("Job metadata retrieved from Redis")

	return &metadata, nil
}

// UpdateJobMetadata updates specific fields in existing job metadata
func (r *RedisClient) UpdateJobMetadata(ctx context.Context, jobID string, updates map[string]interface{}) error {
	// Get existing metadata
	metadata, err := r.GetJobMetadata(ctx, jobID)
	if err != nil {
		return err
	}

	// Apply updates
	if generatedKey, ok := updates["generated_key"].(string); ok {
		metadata.GeneratedKey = generatedKey
	}

	// Save updated metadata
	return r.SetJobMetadata(ctx, jobID, metadata)
}

// DeleteJobMetadata removes job metadata from Redis
func (r *RedisClient) DeleteJobMetadata(ctx context.Context, jobID string) error {
	key := r.jobKey(jobID)

	if err := r.client.Del(ctx, key).Err(); err != nil {
		return fmt.Errorf("failed to delete job metadata from Redis: %w", err)
	}

	logger.Debug().
		Str("job_id", jobID).
		Msg("Job metadata deleted from Redis")

	return nil
}

// Close closes the Redis connection
func (r *RedisClient) Close() error {
	return r.client.Close()
}
