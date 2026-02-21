package handlers

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/internal/messaging"
	"github.com/safina57/animoji/gateway/internal/models"
	"github.com/safina57/animoji/gateway/pkg/logger"
	"github.com/safina57/animoji/gateway/pkg/storage"
)

const emojiSSETimeout = 3 * time.Minute

// HandleEmojiStatusStream handles progressive SSE for emoji jobs.
// Each of the 3 emoji variants is streamed to the client as it completes,
// followed by a final "all_complete" event when all 3 are ready.
func HandleEmojiStatusStream(w http.ResponseWriter, r *http.Request, eventManager *messaging.EventManager[models.EmojiPartialEvent], storageService *storage.MinIOService) {
	jobID := chi.URLParam(r, "job_id")

	if _, err := uuid.Parse(jobID); err != nil {
		respondError(w, "Invalid job_id format", http.StatusBadRequest)
		return
	}

	// Disable write timeout so the long-lived SSE connection is not killed by the server
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

	eventChan := eventManager.Register(jobID)
	defer eventManager.Unregister(jobID)

	timeout := time.After(emojiSSETimeout)

	// totalVariants is set dynamically when the worker publishes its "started" event.
	totalVariants := 0
	// variantURLs accumulates presigned URLs as each variant completes
	variantURLs := make(map[string]string, 3)

	for {
		select {
		case event, ok := <-eventChan:
			if !ok {
				return
			}

			if event.Status == constants.StatusStarted {
				totalVariants = event.TotalVariants
				continue
			}

			if event.Status == constants.StatusFailed {
				sendSSEEvent(w, flusher, map[string]any{
					"type":    "variant_failed",
					"emotion": event.Emotion,
				})
				continue
			}

			if event.Status == constants.StatusCompleted {
				variantURL, err := storageService.GetPresignedURLForKey(ctx, event.ResultKey, presignedURLExpiry)
				if err != nil {
					logger.Error().Err(err).
						Str("job_id", jobID).
						Str("emotion", event.Emotion).
						Msg("Failed to generate presigned URL for emoji variant")
					continue
				}

				variantURLs[event.Emotion] = variantURL
				completed := len(variantURLs)

				sendSSEEvent(w, flusher, map[string]any{
					"type":        "variant_ready",
					"emotion":     event.Emotion,
					"variant_url": variantURL,
					"completed":   completed,
					"total":       totalVariants,
				})

				if totalVariants > 0 && completed == totalVariants {
					sendSSEEvent(w, flusher, map[string]any{
						"type":     "all_complete",
						"variants": variantURLs,
					})
					return
				}
			}

		case <-timeout:
			logger.Warn().Str("job_id", jobID).Msg("Emoji SSE connection timeout")
			sendSSEEvent(w, flusher, map[string]string{"type": "timeout"})
			return

		case <-ctx.Done():
			return
		}
	}
}
