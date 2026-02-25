package emojis

import (
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

const emojiSSETimeout = 3 * time.Minute

// HandleEmojiStatusStream handles GET /emojis/jobs/{job_id}/stream
func (h *EmojiHandler) HandleEmojiStatusStream(
	em *messaging.EventManager[jobs.EmojiPartialEvent],
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

		// Register FIRST so no future events are missed while we seed from Redis.
		eventChan := em.Register(jobID)
		defer em.Unregister(jobID)

		timeout := time.After(emojiSSETimeout)

		totalVariants := 0
		variantURLs := make(map[string]string, 3)
		variantIDs := make(map[string]string, 3)

		redisClient := cache.MustGetClient()
		if meta, err := redisClient.GetEmojiJobMetadata(ctx, jobID); err == nil {
			totalVariants = meta.TotalVariants

			if totalVariants > 0 && len(meta.CompletedVariants) < totalVariants {
				sendSSEEvent(w, flusher, map[string]any{
					"type":  "started",
					"total": totalVariants,
				})
			}

			for _, v := range meta.CompletedVariants {
				url, err := storageSvc.GetPresignedURLForKey(ctx, v.ResultKey, constants.PresignedURLExpiry)
				if err != nil {
					logger.Error().Err(err).
						Str("job_id", jobID).
						Str("emotion", v.Emotion).
						Msg("Failed to generate presigned URL for cached emoji variant")
					continue
				}
				variantURLs[v.Emotion] = url
				variantIDs[v.Emotion] = v.VariantID
				sendSSEEvent(w, flusher, map[string]any{
					"type":        "variant_ready",
					"emotion":     v.Emotion,
					"variant_url": url,
					"variant_id":  v.VariantID,
					"completed":   len(variantURLs),
					"total":       totalVariants,
				})
			}
			if totalVariants > 0 && len(variantURLs) >= totalVariants {
				sendSSEEvent(w, flusher, map[string]any{
					"type":         "all_complete",
					"variant_urls": variantURLs,
					"variant_ids":  variantIDs,
				})
				return
			}
		}

		for {
			select {
			case event, ok := <-eventChan:
				if !ok {
					return
				}

				if event.Status == constants.StatusStarted {
					if totalVariants == 0 {
						totalVariants = event.TotalVariants
					}
					sendSSEEvent(w, flusher, map[string]any{
						"type":  "started",
						"total": totalVariants,
					})
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
					if _, alreadySent := variantURLs[event.Emotion]; alreadySent {
						continue
					}

					variantURL, err := storageSvc.GetPresignedURLForKey(ctx, event.ResultKey, constants.PresignedURLExpiry)
					if err != nil {
						logger.Error().Err(err).
							Str("job_id", jobID).
							Str("emotion", event.Emotion).
							Msg("Failed to generate presigned URL for emoji variant")
						continue
					}

					variantURLs[event.Emotion] = variantURL
					variantIDs[event.Emotion] = event.VariantID
					completed := len(variantURLs)

					sendSSEEvent(w, flusher, map[string]any{
						"type":        "variant_ready",
						"emotion":     event.Emotion,
						"variant_url": variantURL,
						"variant_id":  event.VariantID,
						"completed":   completed,
						"total":       totalVariants,
					})

					if totalVariants > 0 && completed == totalVariants {
						sendSSEEvent(w, flusher, map[string]any{
							"type":         "all_complete",
							"variant_urls": variantURLs,
							"variant_ids":  variantIDs,
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

func respondJSON(w http.ResponseWriter, data any, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data) //nolint:errcheck
}

func respondError(w http.ResponseWriter, message string, statusCode int) {
	respondJSON(w, map[string]string{"error": message}, statusCode)
}
