package images

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
	"github.com/safina57/animoji/gateway/internal/jobs"
	"github.com/safina57/animoji/gateway/internal/messaging"
	"github.com/safina57/animoji/gateway/internal/cache"
	"github.com/safina57/animoji/gateway/internal/storage"
	"github.com/safina57/animoji/gateway/pkg/logger"
)

const sseTimeout = 2 * time.Minute

// HandleJobStatusStream handles GET /images/jobs/{job_id}/stream
func (h *ImageHandler) HandleJobStatusStream(
	em *messaging.EventManager[jobs.ImageStatusEvent],
	storageSvc *storage.MinIOService,
) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		jobID := chi.URLParam(r, "job_id")
		if _, err := uuid.Parse(jobID); err != nil {
			respondError(w, "Invalid job_id format", http.StatusBadRequest)
			return
		}

		rc := http.NewResponseController(w)
		_ = rc.SetWriteDeadline(time.Time{})

		origin := os.Getenv("FRONTEND_URL")
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("X-Accel-Buffering", "no")

		flusher, ok := w.(http.Flusher)
		if !ok {
			respondError(w, "SSE not supported", http.StatusInternalServerError)
			return
		}

		ctx := r.Context()

		fmt.Fprintf(w, ": connected\n\n")
		flusher.Flush()

		eventChan := em.Register(jobID)
		defer em.Unregister(jobID)

		timeout := time.After(sseTimeout)

		for {
			select {
			case event, ok := <-eventChan:
				if !ok {
					return
				}
				if event.Status == constants.StatusCompleted {
					sendCompletedEvent(w, flusher, jobID, event.IterationNum, storageSvc, ctx)
				}
				if event.Status == constants.StatusFailed {
					sendSSEEvent(w, flusher, map[string]string{"status": event.Status})
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
}

func sendCompletedEvent(w http.ResponseWriter, flusher http.Flusher, jobID string, iterationNum int, storageSvc *storage.MinIOService, ctx context.Context) {
	redisClient := cache.MustGetClient()
	metadata, err := redisClient.GetJobMetadata(ctx, jobID)
	if err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Msg("Failed to retrieve job metadata for SSE URLs")
		sendSSEError(w, flusher, "Failed to retrieve result")
		return
	}

	originalKey := fmt.Sprintf("%s%s/original.%s", constants.PrefixTmp, jobID, metadata.OriginalExt)
	resultKey := fmt.Sprintf("%s%s/result_v%d.png", constants.PrefixTmp, jobID, iterationNum)

	originalURL, err := storageSvc.GetPresignedURLForKey(ctx, originalKey, constants.PresignedURLExpiry)
	if err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Msg("Failed to generate presigned URL for original")
		sendSSEError(w, flusher, "Failed to retrieve result")
		return
	}

	resultURL, err := storageSvc.GetPresignedURLForKey(ctx, resultKey, constants.PresignedURLExpiry)
	if err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Int("iteration_num", iterationNum).Msg("Failed to generate presigned URL for result")
		sendSSEError(w, flusher, "Failed to retrieve result")
		return
	}

	sendSSEEvent(w, flusher, map[string]any{
		"status":        constants.StatusCompleted,
		"job_id":        jobID,
		"original_url":  originalURL,
		"result_url":    resultURL,
		"iteration_num": iterationNum,
	})
}

func sendSSEEvent(w http.ResponseWriter, flusher http.Flusher, data any) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to marshal SSE event data")
		return
	}
	fmt.Fprintf(w, "data: %s\n\n", jsonData)
	flusher.Flush()
}

func sendSSEError(w http.ResponseWriter, flusher http.Flusher, message string) {
	sendSSEEvent(w, flusher, map[string]string{
		"status": constants.StatusFailed,
		"error":  message,
	})
}

func respondJSON(w http.ResponseWriter, data any, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data) //nolint:errcheck
}

func respondError(w http.ResponseWriter, message string, statusCode int) {
	respondJSON(w, map[string]string{"error": message}, statusCode)
}
