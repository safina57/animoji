package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/internal/messaging"
	"github.com/safina57/animoji/gateway/pkg/logger"
	"github.com/safina57/animoji/gateway/pkg/storage"
)

const (
	sseTimeout         = 2 * time.Minute
	presignedURLExpiry = time.Hour
)

// HandleJobStatusStream handles SSE connections for real-time job status updates
func HandleJobStatusStream(w http.ResponseWriter, r *http.Request, eventManager *messaging.EventManager, storageService *storage.MinIOService) {
	jobID := chi.URLParam(r, "job_id")

	// Validate UUID format
	if _, err := uuid.Parse(jobID); err != nil {
		respondError(w, "Invalid job_id format", http.StatusBadRequest)
		return
	}

	// Set SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		respondError(w, "SSE not supported", http.StatusInternalServerError)
		return
	}

	ctx := r.Context()

	logger.Info().Str("job_id", jobID).Msg("SSE connection established")

	// Register for events
	eventChan := eventManager.Register(jobID)
	defer eventManager.Unregister(jobID, eventChan)

	// Wait for event or timeout
	timeout := time.After(sseTimeout)

	for {
		select {
		case event := <-eventChan:
			logger.Info().
				Str("job_id", jobID).
				Str("status", event.Status).
				Msg("Sending status event to SSE client")

			if event.Status == constants.StatusCompleted {
				sendCompletedEvent(w, flusher, jobID, storageService)
			}
			if event.Status == constants.StatusFailed {

				eventData := map[string]string{
					"status": event.Status,
				}
				sendSSEEvent(w, flusher, "status", eventData)
			}
			return

		case <-timeout:
			logger.Warn().Str("job_id", jobID).Msg("SSE connection timeout")
			sendSSEError(w, flusher, "Connection timeout - job still processing")
			return

		case <-ctx.Done():
			// Client disconnected
			logger.Info().Str("job_id", jobID).Msg("SSE client disconnected")
			return
		}
	}
}

// sendCompletedEvent sends a completed status event with presigned URLs
func sendCompletedEvent(w http.ResponseWriter, flusher http.Flusher, jobID string, storageService *storage.MinIOService) {
	ctx := context.Background()

	// Generate presigned URLs
	originalURL, err := storageService.GetPresignedURLForOriginal(ctx, jobID, presignedURLExpiry)
	if err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Msg("Failed to generate presigned URL for original")
		sendSSEError(w, flusher, "Failed to retrieve result")
		return
	}

	resultURL, err := storageService.GetPresignedURLForResult(ctx, jobID, presignedURLExpiry)
	if err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Msg("Failed to generate presigned URL for result")
		sendSSEError(w, flusher, "Failed to retrieve result")
		return
	}

	// Send completed event
	eventData := map[string]string{
		"status":       constants.StatusCompleted,
		"job_id":       jobID,
		"original_url": originalURL,
		"result_url":   resultURL,
	}
	sendSSEEvent(w, flusher, "status", eventData)

	logger.Info().Str("job_id", jobID).Msg("Sent completed event to SSE client")
}

// sendSSEEvent sends an SSE event
func sendSSEEvent(w http.ResponseWriter, flusher http.Flusher, eventType string, data any) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to marshal SSE event data")
		return
	}

	fmt.Fprintf(w, "event: %s\ndata: %s\n\n", eventType, jsonData)
	flusher.Flush()
}

// sendSSEError sends an error event and closes the connection
func sendSSEError(w http.ResponseWriter, flusher http.Flusher, message string) {
	sendSSEEvent(w, flusher, "error", map[string]string{"error": message})
}
