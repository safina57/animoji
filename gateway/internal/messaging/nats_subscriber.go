package messaging

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/google/uuid"
	nats "github.com/nats-io/nats.go"
	"github.com/safina57/animoji/gateway/internal/cache"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/internal/jobs"
	"github.com/safina57/animoji/gateway/pkg/logger"
)

// NatsSubscriber handles NATS subscriptions for status events
type NatsSubscriber struct {
	client            *NatsClient
	eventManager      *EventManager[jobs.ImageStatusEvent]
	emojiEventManager *EventManager[jobs.EmojiPartialEvent]
}

// NewNatsSubscriber creates a new NATS subscriber
func NewNatsSubscriber(client *NatsClient, eventManager *EventManager[jobs.ImageStatusEvent], emojiEventManager *EventManager[jobs.EmojiPartialEvent]) *NatsSubscriber {
	return &NatsSubscriber{
		client:            client,
		eventManager:      eventManager,
		emojiEventManager: emojiEventManager,
	}
}

// SubscribeToStatusEvents subscribes to job status updates on anime.status.*
func (s *NatsSubscriber) SubscribeToStatusEvents(ctx context.Context) error {
	_, err := s.client.conn.Subscribe("anime.status.*", func(msg *nats.Msg) {
		var event jobs.ImageStatusEvent
		if err := json.Unmarshal(msg.Data, &event); err != nil {
			logger.Error().Err(err).Str("subject", msg.Subject).Msg("Failed to parse status event")
			return
		}

		// Extract job_id from subject (anime.status.{job_id})
		parts := strings.Split(msg.Subject, ".")
		if len(parts) != 3 {
			logger.Error().Str("subject", msg.Subject).Msg("Invalid status event subject format")
			return
		}
		jobID := parts[2]

		// Append generated key and store response ID in Redis on completion
		if event.Status == constants.StatusCompleted && event.ResultKey != "" {
			redisClient := cache.MustGetClient()

			if err := redisClient.AppendJobGeneratedKey(ctx, jobID, event.ResultKey, event.ResponseID); err != nil {
				logger.Error().Err(err).
					Str("job_id", jobID).
					Msg("Failed to append generated key to job metadata in Redis")
			} else {
				logger.Debug().
					Str("job_id", jobID).
					Int("iteration_num", event.IterationNum).
					Bool("has_response_id", event.ResponseID != "").
					Msg("Appended generated key to job metadata in Redis")
			}
		}

		// Route event to all connections waiting for this job_id
		s.eventManager.NotifyJob(jobID, event)
	})

	if err != nil {
		return err
	}

	logger.Info().Msg("Subscribed to anime.status.* for job status events")

	// Keep subscription alive until context is cancelled
	<-ctx.Done()
	return ctx.Err()
}

// SubscribeToEmojiStatusEvents subscribes to emoji variant completion events on emoji.status.*
func (s *NatsSubscriber) SubscribeToEmojiStatusEvents(ctx context.Context) error {
	_, err := s.client.conn.Subscribe("emoji.status.*", func(msg *nats.Msg) {
		var event jobs.EmojiStatusEvent
		if err := json.Unmarshal(msg.Data, &event); err != nil {
			logger.Error().Err(err).Str("subject", msg.Subject).Msg("Failed to parse emoji status event")
			return
		}

		// Extract job_id from subject (emoji.status.{job_id})
		parts := strings.Split(msg.Subject, ".")
		if len(parts) != 3 {
			logger.Error().Str("subject", msg.Subject).Msg("Invalid emoji status event subject format")
			return
		}
		jobID := parts[2]

		redisClient := cache.MustGetClient()

		var variantID string

		switch event.Status {
		case constants.StatusStarted:
			// Worker has resolved actual emotion count — update Redis so reconnecting
			// clients and AppendEmojiVariantResult use the real total.
			if err := redisClient.UpdateEmojiJobTotalVariants(ctx, jobID, event.TotalVariants); err != nil {
				logger.Error().Err(err).
					Str("job_id", jobID).
					Int("total_variants", event.TotalVariants).
					Msg("Failed to update emoji job total variants in Redis")
			} else {
				logger.Debug().
					Str("job_id", jobID).
					Int("total_variants", event.TotalVariants).
					Msg("Updated emoji job total variants in Redis")
			}

		case constants.StatusCompleted:
			if event.ResultKey != "" {
				variantID = uuid.New().String()
				variant := cache.EmojiVariantResult{
					Emotion:      event.Emotion,
					VariantIndex: event.VariantIndex,
					ResultKey:    event.ResultKey,
					VariantID:    variantID,
				}
				if _, err := redisClient.AppendEmojiVariantResult(ctx, jobID, variant); err != nil {
					logger.Error().Err(err).
						Str("job_id", jobID).
						Str("emotion", event.Emotion).
						Msg("Failed to append emoji variant result to Redis")
					variantID = "" // clear so a broken entry is not forwarded
				} else {
					logger.Debug().
						Str("job_id", jobID).
						Str("emotion", event.Emotion).
						Str("variant_id", variantID).
						Int("variant_index", event.VariantIndex).
						Msg("Appended emoji variant result to Redis")
				}
			}
		}

		// Route every event (started / completed / failed) to the SSE handler
		s.emojiEventManager.NotifyJob(jobID, jobs.EmojiPartialEvent{
			Emotion:       event.Emotion,
			VariantIndex:  event.VariantIndex,
			ResultKey:     event.ResultKey,
			VariantID:     variantID,
			Status:        event.Status,
			TotalVariants: event.TotalVariants,
		})
	})

	if err != nil {
		return err
	}

	logger.Info().Msg("Subscribed to emoji.status.* for emoji variant events")

	<-ctx.Done()
	return ctx.Err()
}
