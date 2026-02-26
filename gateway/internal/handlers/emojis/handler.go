package emojis

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	internalAuth "github.com/safina57/animoji/gateway/internal/auth"
	"github.com/safina57/animoji/gateway/internal/cache"
	"github.com/safina57/animoji/gateway/internal/dto"
	"github.com/safina57/animoji/gateway/internal/handlers"
	emojisSvc "github.com/safina57/animoji/gateway/internal/services/emojis"
)

// EmojiHandler holds the emoji service for all emoji HTTP endpoints.
type EmojiHandler struct {
	svc         *emojisSvc.EmojiService
	redisClient *cache.RedisClient
}

// NewEmojiHandler creates a new EmojiHandler.
func NewEmojiHandler(svc *emojisSvc.EmojiService, redisClient *cache.RedisClient) *EmojiHandler {
	return &EmojiHandler{
		svc:         svc,
		redisClient: redisClient,
	}
}

// HandleSubmitEmojiJob handles POST /emojis/jobs
func (h *EmojiHandler) HandleSubmitEmojiJob(w http.ResponseWriter, r *http.Request) {
	claims, err := internalAuth.GetUserFromContext(r.Context())
	if err != nil {
		handlers.RespondError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	info, prompt, ok := handlers.ParseImageUpload(w, r)
	if !ok {
		return
	}
	defer info.ClearData()

	jobID, err := h.svc.SubmitEmojiJob(r.Context(), claims.UserID, info.Data, info.Extension, info.MIMEType, prompt)
	if err != nil {
		handlers.RespondError(w, "Failed to submit emoji job", http.StatusInternalServerError)
		return
	}

	handlers.RespondJSON(w, dto.SubmitJobResponse{JobID: jobID, Message: "Emoji job submitted successfully"}, http.StatusAccepted)
}

// HandlePublishEmojiVariant handles POST /emojis/jobs/{job_id}/variants/{variant_id}/publish
func (h *EmojiHandler) HandlePublishEmojiVariant(w http.ResponseWriter, r *http.Request) {
	claims, err := internalAuth.GetUserFromContext(r.Context())
	if err != nil {
		handlers.RespondError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	jobID := chi.URLParam(r, "job_id")
	if _, parseErr := uuid.Parse(jobID); parseErr != nil {
		handlers.RespondError(w, "invalid job_id format", http.StatusBadRequest)
		return
	}

	variantID := chi.URLParam(r, "variant_id")
	if _, parseErr := uuid.Parse(variantID); parseErr != nil {
		handlers.RespondError(w, "invalid variant_id format", http.StatusBadRequest)
		return
	}

	result, err := h.svc.PublishEmojiVariant(r.Context(), claims.UserID, jobID, variantID)
	if err != nil {
		switch {
		case errors.Is(err, emojisSvc.ErrNotFound):
			handlers.RespondError(w, "Emoji job or variant not found or expired", http.StatusNotFound)
		case errors.Is(err, emojisSvc.ErrForbidden):
			handlers.RespondError(w, "Unauthorized to publish this emoji variant", http.StatusForbidden)
		default:
			handlers.RespondError(w, "Failed to publish emoji variant", http.StatusInternalServerError)
		}
		return
	}

	if result.AlreadyPublished {
		handlers.RespondJSON(w, map[string]any{
			"message": "Emoji variant already published",
			"emotion": result.Emotion,
			"url":     result.URL,
		}, http.StatusOK)
		return
	}

	handlers.RespondJSON(w, map[string]any{
		"message": "Emoji variant published successfully",
		"emotion": result.Emotion,
		"url":     result.URL,
	}, http.StatusCreated)
}

// HandleGetMyEmojiPacks handles GET /emojis/me
func (h *EmojiHandler) HandleGetMyEmojiPacks(w http.ResponseWriter, r *http.Request) {
	claims, err := internalAuth.GetUserFromContext(r.Context())
	if err != nil {
		handlers.RespondError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	params := dto.ParsePaginationParams(r, 20)

	items, hasMore, err := h.svc.GetMyEmojiPacks(r.Context(), claims.UserID, params)
	if err != nil {
		handlers.RespondError(w, "Failed to fetch emoji packs", http.StatusInternalServerError)
		return
	}

	handlers.RespondJSON(w, dto.EmojiPacksResponseDTO{
		Packs:   items,
		HasMore: hasMore,
		Offset:  params.Offset,
		Limit:   params.Limit,
	}, http.StatusOK)
}
