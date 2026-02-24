package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/auth"
	"github.com/safina57/animoji/gateway/internal/models"
	"github.com/safina57/animoji/gateway/internal/repository"
	"github.com/safina57/animoji/gateway/pkg/cache"
	"github.com/safina57/animoji/gateway/pkg/logger"
	"github.com/safina57/animoji/gateway/pkg/storage"
)

// PublishEmojiHandler handles the per-variant emoji publish endpoint.
type PublishEmojiHandler struct {
	repo *repository.Repository
}

// NewPublishEmojiHandler creates a new publish emoji handler.
func NewPublishEmojiHandler(repo *repository.Repository) *PublishEmojiHandler {
	return &PublishEmojiHandler{repo: repo}
}

// HandlePublishEmojiVariant publishes a single emoji variant to permanent public storage.
// POST /emojis/{job_id}/variants/{emotion}/publish
func (h *PublishEmojiHandler) HandlePublishEmojiVariant(w http.ResponseWriter, r *http.Request) {
	claims, err := auth.GetUserFromContext(r.Context())
	if err != nil {
		respondError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	jobID := chi.URLParam(r, "job_id")
	if _, err := uuid.Parse(jobID); err != nil {
		respondError(w, "invalid job_id format", http.StatusBadRequest)
		return
	}

	emotion := chi.URLParam(r, "emotion")
	if emotion == "" {
		respondError(w, "emotion is required", http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	// Retrieve emoji job metadata from Redis (validates the job exists).
	redisClient := cache.MustGetClient()
	metadata, err := redisClient.GetEmojiJobMetadata(ctx, jobID)
	if err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Msg("Emoji job metadata not found")
		respondError(w, "Emoji job not found or expired", http.StatusNotFound)
		return
	}

	// Ownership check.
	if metadata.UserID != claims.UserID {
		logger.Warn().
			Str("job_id", jobID).
			Str("emotion", emotion).
			Str("metadata_user_id", metadata.UserID.String()).
			Str("request_user_id", claims.UserID.String()).
			Msg("User attempted to publish another user's emoji variant")
		respondError(w, "Unauthorized to publish this emoji variant", http.StatusForbidden)
		return
	}

	// Verify this emotion was actually generated.
	var generatedKey string
	for _, v := range metadata.CompletedVariants {
		if v.Emotion == emotion {
			generatedKey = v.ResultKey
			break
		}
	}
	if generatedKey == "" {
		respondError(w, "Emoji variant not found or not yet completed", http.StatusNotFound)
		return
	}

	// Find or create the pack for this job (packs are created on first variant publish).
	pack, err := h.repo.FindOrCreateEmojiPack(ctx, jobID, metadata.UserID)
	if err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Msg("Failed to find/create emoji pack")
		respondError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Idempotency: if already published, return the existing URL.
	existing, err := h.repo.GetEmojiVariantByPackAndEmotion(ctx, pack.ID, emotion)
	if err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Str("emotion", emotion).Msg("Failed to query existing emoji variant")
		respondError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	if existing != nil {
		minioService := storage.NewMinIOService()
		respondJSON(w, map[string]any{
			"message": "Emoji variant already published",
			"emotion": emotion,
			"url":     minioService.GetPublicURL(existing.ResultKey),
		}, http.StatusOK)
		return
	}

	// Copy the tmp file to permanent public storage.
	minioService := storage.NewMinIOService()
	resultKeys, err := minioService.PublishEmojiFiles(ctx, jobID, pack.ID, []string{emotion})
	if err != nil {
		logger.Error().Err(err).
			Str("job_id", jobID).
			Str("emotion", emotion).
			Str("pack_id", pack.ID.String()).
			Msg("Failed to copy emoji variant to permanent storage")
		respondError(w, "Failed to publish emoji variant", http.StatusInternalServerError)
		return
	}

	resultKey := resultKeys[emotion]

	// Persist the variant record.
	variant := &models.EmojiVariant{
		ID:        uuid.New(),
		PackID:    pack.ID,
		Emotion:   emotion,
		ResultKey: resultKey,
	}
	if err := h.repo.CreateEmojiVariant(ctx, variant); err != nil {
		logger.Error().Err(err).
			Str("job_id", jobID).
			Str("emotion", emotion).
			Msg("Failed to create emoji variant record")
		// Best-effort cleanup.
		go func() {
			cleanCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()
			_ = minioService.DeleteObject(cleanCtx, resultKey)
		}()
		respondError(w, "Failed to save emoji variant", http.StatusInternalServerError)
		return
	}

	logger.Info().
		Str("job_id", jobID).
		Str("emotion", emotion).
		Str("pack_id", pack.ID.String()).
		Str("user_id", claims.UserID.String()).
		Msg("Emoji variant published successfully")

	respondJSON(w, map[string]any{
		"message": "Emoji variant published successfully",
		"emotion": emotion,
		"url":     minioService.GetPublicURL(resultKey),
	}, http.StatusCreated)
}
