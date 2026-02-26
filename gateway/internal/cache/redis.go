package cache

import (
	"context"
	"encoding/json"
	"errors"
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
	JobID          string    `json:"job_id"`
	UserID         uuid.UUID `json:"user_id"`
	Prompts        []string  `json:"prompts"`                  // Array of prompts (original + refinements)
	OriginalKey    string    `json:"original_key"`             // tmp/{job_id}/original.{ext}
	OriginalExt    string    `json:"original_ext"`             // "jpg" or "png" — for publish path reconstruction
	GeneratedKeys  []string  `json:"generated_keys,omitempty"` // Array of result keys (versioned)
	Width          int       `json:"width"`
	Height         int       `json:"height"`
	IterationNum   int       `json:"iteration_num"`
	LastResponseID string    `json:"last_response_id,omitempty"` // OpenAI Responses API ID for next iteration
	CreatedAt      time.Time `json:"created_at"`
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

	data, err := json.Marshal(metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal job metadata: %w", err)
	}

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

	data, err := r.client.Get(ctx, key).Bytes()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("job metadata not found: %s", jobID)
		}
		return nil, fmt.Errorf("failed to get job metadata from Redis: %w", err)
	}

	var metadata JobMetadata
	if err := json.Unmarshal(data, &metadata); err != nil {
		return nil, fmt.Errorf("failed to unmarshal job metadata: %w", err)
	}

	logger.Debug().
		Str("job_id", jobID).
		Msg("Job metadata retrieved from Redis")

	return &metadata, nil
}

// AppendJobGeneratedKey appends a new generated result key and stores the latest response ID
func (r *RedisClient) AppendJobGeneratedKey(ctx context.Context, jobID string, generatedKey string, responseID string) error {
	metadata, err := r.GetJobMetadata(ctx, jobID)
	if err != nil {
		return err
	}

	metadata.GeneratedKeys = append(metadata.GeneratedKeys, generatedKey)
	if responseID != "" {
		metadata.LastResponseID = responseID
	}

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

// EmojiVariantResult holds the result for a single completed emoji variant
type EmojiVariantResult struct {
	Emotion      string `json:"emotion"`
	VariantIndex int    `json:"variant_index"`
	ResultKey    string `json:"result_key"`
	VariantID    string `json:"variant_id"` // opaque UUID used as publish token; never touches file paths
}

// EmojiJobMetadata represents temporary emoji job data cached in Redis
type EmojiJobMetadata struct {
	JobID             string               `json:"job_id"`
	UserID            uuid.UUID            `json:"user_id"`
	Prompt            string               `json:"prompt"`
	OriginalKey       string               `json:"original_key"`
	OriginalExt       string               `json:"original_ext"`
	TotalVariants     int                  `json:"total_variants"`
	CompletedVariants []EmojiVariantResult `json:"completed_variants"`
	CreatedAt         time.Time            `json:"created_at"`
}

// emojiJobKey returns the Redis key for an emoji job ID
func (r *RedisClient) emojiJobKey(jobID string) string {
	return fmt.Sprintf("emoji_job:%s", jobID)
}

// SetEmojiJobMetadata stores emoji job metadata in Redis with TTL
func (r *RedisClient) SetEmojiJobMetadata(ctx context.Context, jobID string, metadata *EmojiJobMetadata) error {
	key := r.emojiJobKey(jobID)

	data, err := json.Marshal(metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal emoji job metadata: %w", err)
	}

	if err := r.client.Set(ctx, key, data, r.ttl).Err(); err != nil {
		return fmt.Errorf("failed to set emoji job metadata in Redis: %w", err)
	}

	logger.Debug().Str("job_id", jobID).Dur("ttl", r.ttl).Msg("Emoji job metadata cached in Redis")
	return nil
}

// GetEmojiJobMetadata retrieves emoji job metadata from Redis
func (r *RedisClient) GetEmojiJobMetadata(ctx context.Context, jobID string) (*EmojiJobMetadata, error) {
	key := r.emojiJobKey(jobID)

	data, err := r.client.Get(ctx, key).Bytes()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("emoji job metadata not found: %s", jobID)
		}
		return nil, fmt.Errorf("failed to get emoji job metadata from Redis: %w", err)
	}

	var metadata EmojiJobMetadata
	if err := json.Unmarshal(data, &metadata); err != nil {
		return nil, fmt.Errorf("failed to unmarshal emoji job metadata: %w", err)
	}

	logger.Debug().Str("job_id", jobID).Msg("Emoji job metadata retrieved from Redis")
	return &metadata, nil
}

// UpdateEmojiJobTotalVariants atomically sets the TotalVariants field once the
// worker has resolved the actual number of emotion variants it will generate.
func (r *RedisClient) UpdateEmojiJobTotalVariants(ctx context.Context, jobID string, total int) error {
	key := r.emojiJobKey(jobID)

	for {
		err := r.client.Watch(ctx, func(tx *redis.Tx) error {
			data, err := tx.Get(ctx, key).Bytes()
			if err != nil {
				return fmt.Errorf("failed to get emoji job metadata: %w", err)
			}

			var metadata EmojiJobMetadata
			if unmarshalErr := json.Unmarshal(data, &metadata); unmarshalErr != nil {
				return fmt.Errorf("failed to unmarshal emoji job metadata: %w", unmarshalErr)
			}

			metadata.TotalVariants = total

			newData, err := json.Marshal(metadata)
			if err != nil {
				return fmt.Errorf("failed to marshal emoji job metadata: %w", err)
			}

			_, err = tx.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
				pipe.Set(ctx, key, newData, r.ttl)
				return nil
			})
			return err
		}, key)

		if err == nil {
			return nil
		}
		if errors.Is(err, redis.TxFailedErr) {
			continue
		}
		return fmt.Errorf("failed to atomically update emoji job total variants: %w", err)
	}
}

// AppendEmojiVariantResult atomically appends a completed variant result to the
// emoji job metadata using optimistic locking (WATCH/MULTI/EXEC).
// Returns true when all variants are complete.
func (r *RedisClient) AppendEmojiVariantResult(ctx context.Context, jobID string, variant EmojiVariantResult) (bool, error) {
	if variant.VariantID == "" {
		variant.VariantID = uuid.New().String()
	}
	key := r.emojiJobKey(jobID)
	var allComplete bool

	for {
		err := r.client.Watch(ctx, func(tx *redis.Tx) error {
			data, err := tx.Get(ctx, key).Bytes()
			if err != nil {
				return fmt.Errorf("failed to get emoji job metadata: %w", err)
			}

			var metadata EmojiJobMetadata
			if unmarshalErr := json.Unmarshal(data, &metadata); unmarshalErr != nil {
				return fmt.Errorf("failed to unmarshal emoji job metadata: %w", unmarshalErr)
			}

			metadata.CompletedVariants = append(metadata.CompletedVariants, variant)
			allComplete = metadata.TotalVariants > 0 && len(metadata.CompletedVariants) >= metadata.TotalVariants

			newData, err := json.Marshal(metadata)
			if err != nil {
				return fmt.Errorf("failed to marshal emoji job metadata: %w", err)
			}

			_, err = tx.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
				pipe.Set(ctx, key, newData, r.ttl)
				return nil
			})
			return err
		}, key)

		if err == nil {
			return allComplete, nil
		}
		if errors.Is(err, redis.TxFailedErr) {
			continue
		}
		return false, fmt.Errorf("failed to atomically append emoji variant result: %w", err)
	}
}

// DeleteEmojiJobMetadata removes emoji job metadata from Redis
func (r *RedisClient) DeleteEmojiJobMetadata(ctx context.Context, jobID string) error {
	key := r.emojiJobKey(jobID)

	if err := r.client.Del(ctx, key).Err(); err != nil {
		return fmt.Errorf("failed to delete emoji job metadata from Redis: %w", err)
	}

	logger.Debug().Str("job_id", jobID).Msg("Emoji job metadata deleted from Redis")
	return nil
}

// Close closes the Redis connection
func (r *RedisClient) Close() error {
	return r.client.Close()
}
