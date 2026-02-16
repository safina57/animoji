package messaging

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/nats-io/nats.go"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/internal/models"
	"github.com/safina57/animoji/gateway/pkg/cache"
	"github.com/safina57/animoji/gateway/pkg/logger"
)

// NatsSubscriber handles NATS subscriptions for status events
type NatsSubscriber struct {
	client       *NatsClient
	eventManager *EventManager
}

// NewNatsSubscriber creates a new NATS subscriber
func NewNatsSubscriber(client *NatsClient, eventManager *EventManager) *NatsSubscriber {
	return &NatsSubscriber{
		client:       client,
		eventManager: eventManager,
	}
}

// SubscribeToStatusEvents subscribes to job status updates on anime.status.*
func (s *NatsSubscriber) SubscribeToStatusEvents(ctx context.Context) error {
	_, err := s.client.conn.Subscribe("anime.status.*", func(msg *nats.Msg) {
		var event models.StatusEvent
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

		// Update Redis cache with generated key on completion
		if event.Status == constants.StatusCompleted && event.ResultKey != "" {
			redisClient := cache.MustGetClient()
			updates := map[string]any{
				"generated_key": event.ResultKey,
			}

			if err := redisClient.UpdateJobMetadata(ctx, jobID, updates); err != nil {
				logger.Error().Err(err).
					Str("job_id", jobID).
					Msg("Failed to update job metadata in Redis")
			} else {
				logger.Debug().
					Str("job_id", jobID).
					Msg("Updated job metadata in Redis with generated key")
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
