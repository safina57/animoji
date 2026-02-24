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
	"github.com/safina57/animoji/gateway/pkg/cache"
	"github.com/safina57/animoji/gateway/pkg/logger"
	"github.com/safina57/animoji/gateway/pkg/storage"
)

const emojiSSETimeout = 3 * time.Minute

// HandleEmojiStatusStream handles progressive SSE for emoji jobs.
//
// On connect it replays any already-completed variants from Redis so that a
// reconnecting client receives the full picture without re-running generation.
// The "started" event from the worker sets totalVariants dynamically; Redis
// serves as a fallback in case that event was already processed.
func HandleEmojiStatusStream(w http.ResponseWriter, r *http.Request, eventManager *messaging.EventManager[models.EmojiPartialEvent], storageService *storage.MinIOService) {
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
	eventChan := eventManager.Register(jobID)
	defer eventManager.Unregister(jobID)

	timeout := time.After(emojiSSETimeout)

	totalVariants := 0
	variantURLs := make(map[string]string, 3)
	variantIDs := make(map[string]string, 3)

	redisClient := cache.MustGetClient()
	if meta, err := redisClient.GetEmojiJobMetadata(ctx, jobID); err == nil {
		totalVariants = meta.TotalVariants

		// Send "started" first so the client can render skeleton cards before any image
		// arrives — only needed when some variants are still pending.
		if totalVariants > 0 && len(meta.CompletedVariants) < totalVariants {
			sendSSEEvent(w, flusher, map[string]any{
				"type":  "started",
				"total": totalVariants,
			})
		}

		for _, v := range meta.CompletedVariants {
			url, err := storageService.GetPresignedURLForKey(ctx, v.ResultKey, constants.PresignedURLExpiry)
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
		// If all variants were already completed before this connection, finish early.
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
				// Only update if not already seeded from Redis.
				if totalVariants == 0 {
					totalVariants = event.TotalVariants
				}
				// Forward to client so it can switch from LoadingDialog to skeleton cards.
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
				// Skip variants already replayed from Redis on connect.
				if _, alreadySent := variantURLs[event.Emotion]; alreadySent {
					continue
				}

				variantURL, err := storageService.GetPresignedURLForKey(ctx, event.ResultKey, constants.PresignedURLExpiry)
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
