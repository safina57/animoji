package handlers

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/auth"
	"github.com/safina57/animoji/gateway/internal/repository"
)

// LikeImageHandler handles like/unlike endpoints
type LikeImageHandler struct {
	repo *repository.Repository
}

// NewLikeImageHandler creates a new like image handler
func NewLikeImageHandler(repo *repository.Repository) *LikeImageHandler {
	return &LikeImageHandler{repo: repo}
}

func parseImageID(r *http.Request) (uuid.UUID, error) {
	return uuid.Parse(chi.URLParam(r, "image_id"))
}

// HandleLikeImage likes an image for the authenticated user
// POST /images/{image_id}/like
func (h *LikeImageHandler) HandleLikeImage(w http.ResponseWriter, r *http.Request) {
	claims, err := auth.GetUserFromContext(r.Context())
	if err != nil {
		respondError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	imageID, err := parseImageID(r)
	if err != nil {
		respondError(w, "invalid image_id", http.StatusBadRequest)
		return
	}

	if err := h.repo.LikeImage(r.Context(), claims.UserID, imageID); err != nil {
		if repository.IsNotFoundError(err) {
			respondError(w, "image not found", http.StatusNotFound)
			return
		}
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			respondError(w, "already liked", http.StatusConflict)
			return
		}
		respondError(w, "failed to like image", http.StatusInternalServerError)
		return
	}

	respondJSON(w, map[string]string{"message": "liked"}, http.StatusOK)
}

// HandleUnlikeImage removes a like from an image for the authenticated user
// DELETE /images/{image_id}/like
func (h *LikeImageHandler) HandleUnlikeImage(w http.ResponseWriter, r *http.Request) {
	claims, err := auth.GetUserFromContext(r.Context())
	if err != nil {
		respondError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	imageID, err := parseImageID(r)
	if err != nil {
		respondError(w, "invalid image_id", http.StatusBadRequest)
		return
	}

	if err := h.repo.UnlikeImage(r.Context(), claims.UserID, imageID); err != nil {
		if repository.IsNotFoundError(err) {
			respondError(w, "like not found", http.StatusNotFound)
			return
		}
		respondError(w, "failed to unlike image", http.StatusInternalServerError)
		return
	}

	respondJSON(w, map[string]string{"message": "unliked"}, http.StatusOK)
}

// HandleCheckLiked checks whether the authenticated user has liked an image
// GET /images/{image_id}/liked
func (h *LikeImageHandler) HandleCheckLiked(w http.ResponseWriter, r *http.Request) {
	claims, err := auth.GetUserFromContext(r.Context())
	if err != nil {
		respondError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	imageID, err := parseImageID(r)
	if err != nil {
		respondError(w, "invalid image_id", http.StatusBadRequest)
		return
	}

	liked, err := h.repo.HasUserLikedImage(r.Context(), claims.UserID, imageID)
	if err != nil {
		respondError(w, "failed to check like status", http.StatusInternalServerError)
		return
	}

	respondJSON(w, map[string]bool{"liked": liked}, http.StatusOK)
}
