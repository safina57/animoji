package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/internal/messaging"
	"github.com/safina57/animoji/gateway/internal/models"
	"github.com/safina57/animoji/gateway/pkg/cache"
	"github.com/safina57/animoji/gateway/pkg/logger"
	"github.com/safina57/animoji/gateway/pkg/storage"
)

const (
	sseTimeout         = 2 * time.Minute
	presignedURLExpiry = time.Hour
)

// HandleJobStatusStream handles SSE connections for real-time job status updates
func HandleJobStatusStream(w http.ResponseWriter, r *http.Request, eventManager *messaging.EventManager[models.StatusEvent], storageService *storage.MinIOService) {
	jobID := chi.URLParam(r, "job_id")

	// Validate UUID format
	if _, err := uuid.Parse(jobID); err != nil {
		respondError(w, "Invalid job_id format", http.StatusBadRequest)
		return
	}

	// Disable the server's WriteTimeout for this long-lived SSE connection.
	// Without this, Go kills the connection after WriteTimeout (15s),
	// causing ERR_INCOMPLETE_CHUNKED_ENCODING on the browser.
	rc := http.NewResponseController(w)
	_ = rc.SetWriteDeadline(time.Time{}) // zero value = no deadline


	// Set SSE headers
	origin := os.Getenv("FRONTEND_URL")
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", origin)
	w.Header().Set("X-Accel-Buffering", "no") // Disable proxy buffering

	flusher, ok := w.(http.Flusher)
	if !ok {
		respondError(w, "SSE not supported", http.StatusInternalServerError)
		return
	}

	ctx := r.Context()

	// Send an initial comment to flush headers and confirm the connection is alive
	// SSE comments (lines starting with ':') are ignored by EventSource but force the HTTP response to start
	fmt.Fprintf(w, ": connected\n\n")
	flusher.Flush()

	// Register for events
	eventChan := eventManager.Register(jobID)
	defer eventManager.Unregister(jobID)

	// Wait for event or timeout
	timeout := time.After(sseTimeout)

	for {
		select {
		case event, ok := <-eventChan:
			if !ok {
				return
			}
			if event.Status == constants.StatusCompleted {
				sendCompletedEvent(w, flusher, jobID, event.IterationNum, storageService, r.Context())
			}
			if event.Status == constants.StatusFailed {
				eventData := map[string]string{
					"status": event.Status,
				}
				sendSSEEvent(w, flusher, eventData)
			}

			
			return

		case <-timeout:
			logger.Warn().Str("job_id", jobID).Msg("SSE connection timeout")
			sendSSEError(w, flusher, "Connection timeout - job still processing")
			<-ctx.Done()
			return

		case <-ctx.Done():
			return
		}
	}
}

// sendCompletedEvent sends a completed status event with presigned URLs for the tmp files
func sendCompletedEvent(w http.ResponseWriter, flusher http.Flusher, jobID string, iterationNum int, storageService *storage.MinIOService, ctx context.Context) {
	// Fetch job metadata to get the original file extension
	redisClient := cache.MustGetClient()
	metadata, err := redisClient.GetJobMetadata(ctx, jobID)
	if err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Msg("Failed to retrieve job metadata for SSE URLs")
		sendSSEError(w, flusher, "Failed to retrieve result")
		return
	}

	// Build the tmp object keys directly from known paths
	originalKey := fmt.Sprintf("%s%s/original.%s", constants.PrefixTmp, jobID, metadata.OriginalExt)
	resultKey := fmt.Sprintf("%s%s/result_v%d.png", constants.PrefixTmp, jobID, iterationNum)

	originalURL, err := storageService.GetPresignedURLForKey(ctx, originalKey, presignedURLExpiry)
	if err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Msg("Failed to generate presigned URL for original")
		sendSSEError(w, flusher, "Failed to retrieve result")
		return
	}

	resultURL, err := storageService.GetPresignedURLForKey(ctx, resultKey, presignedURLExpiry)
	if err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Int("iteration_num", iterationNum).Msg("Failed to generate presigned URL for result")
		sendSSEError(w, flusher, "Failed to retrieve result")
		return
	}

	// Send completed event
	eventData := map[string]any{
		"status":        constants.StatusCompleted,
		"job_id":        jobID,
		"original_url":  originalURL,
		"result_url":    resultURL,
		"iteration_num": iterationNum,
	}
	sendSSEEvent(w, flusher, eventData)
}

// sendSSEEvent sends an SSE event
func sendSSEEvent(w http.ResponseWriter, flusher http.Flusher, data any) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to marshal SSE event data")
		return
	}

	// Send unnamed event (only data field) for simple onmessage handling
	fmt.Fprintf(w, "data: %s\n\n", jsonData)
	flusher.Flush()
}

// sendSSEError sends an error event with status: failed and closes the connection
func sendSSEError(w http.ResponseWriter, flusher http.Flusher, message string) {
	sendSSEEvent(w, flusher, map[string]string{
		"status": constants.StatusFailed,
		"error":  message,
	})
}
