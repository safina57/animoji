package images

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	internalAuth "github.com/safina57/animoji/gateway/internal/auth"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/internal/dto"
	"github.com/safina57/animoji/gateway/internal/handlers"
	imagesSvc "github.com/safina57/animoji/gateway/internal/services/images"
)

// ImageHandler holds the image service for all image HTTP endpoints.
type ImageHandler struct {
	svc *imagesSvc.ImageService
}

// NewImageHandler creates a new ImageHandler.
func NewImageHandler(svc *imagesSvc.ImageService) *ImageHandler {
	return &ImageHandler{svc: svc}
}

// HandleSubmitJob handles POST /images/jobs
func (h *ImageHandler) HandleSubmitJob(w http.ResponseWriter, r *http.Request) {
	claims, err := internalAuth.GetUserFromContext(r.Context())
	if err != nil {
		respondError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	info, prompt, ok := handlers.ParseImageUpload(w, r)
	if !ok {
		return
	}
	defer info.ClearData()

	jobID, err := h.svc.SubmitJob(r.Context(), claims.UserID, info.Data, info.Extension, info.MIMEType, prompt, info.Width, info.Height)
	if err != nil {
		respondError(w, "Failed to submit job", http.StatusInternalServerError)
		return
	}

	respondJSON(w, dto.SubmitJobResponse{JobID: jobID, Message: "Job submitted successfully"}, http.StatusAccepted)
}

// HandleRefineJob handles POST /images/jobs/{job_id}/refine
func (h *ImageHandler) HandleRefineJob(w http.ResponseWriter, r *http.Request) {
	claims, err := internalAuth.GetUserFromContext(r.Context())
	if err != nil {
		respondError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	jobID := chi.URLParam(r, "job_id")
	if jobID == "" {
		respondError(w, "job_id is required", http.StatusBadRequest)
		return
	}

	var req struct {
		Prompt string `json:"prompt"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Prompt == "" {
		respondError(w, "Refinement prompt is required", http.StatusBadRequest)
		return
	}

	iterationNum, err := h.svc.RefineJob(r.Context(), claims.UserID, jobID, req.Prompt)
	if err != nil {
		switch {
		case errors.Is(err, imagesSvc.ErrNotFound):
			respondError(w, "Job not found or expired", http.StatusNotFound)
		case errors.Is(err, imagesSvc.ErrForbidden):
			respondError(w, "Unauthorized to refine this job", http.StatusForbidden)
		case errors.Is(err, imagesSvc.ErrBadRequest):
			respondError(w, "Job not completed yet, cannot refine", http.StatusBadRequest)
		default:
			respondError(w, "Failed to submit refinement", http.StatusInternalServerError)
		}
		return
	}

	respondJSON(w, dto.SubmitJobResponse{
		JobID:   jobID,
		Message: fmt.Sprintf("Refinement %d submitted successfully", iterationNum),
	}, http.StatusAccepted)
}

// HandlePublishImage handles POST /images/jobs/{job_id}/publish
func (h *ImageHandler) HandlePublishImage(w http.ResponseWriter, r *http.Request) {
	claims, err := internalAuth.GetUserFromContext(r.Context())
	if err != nil {
		respondError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	jobID := chi.URLParam(r, "job_id")
	if jobID == "" {
		respondError(w, "job_id is required", http.StatusBadRequest)
		return
	}

	visibility := r.URL.Query().Get("visibility")
	if visibility == "" {
		visibility = constants.VisibilityPrivate
	}
	if visibility != constants.VisibilityPublic && visibility != constants.VisibilityPrivate {
		respondError(w, "visibility must be 'public' or 'private'", http.StatusBadRequest)
		return
	}

	imageID, err := h.svc.PublishImage(r.Context(), claims.UserID, jobID, visibility)
	if err != nil {
		switch {
		case errors.Is(err, imagesSvc.ErrNotFound):
			respondError(w, "Job not found or generated image missing", http.StatusNotFound)
		case errors.Is(err, imagesSvc.ErrForbidden):
			respondError(w, "Unauthorized to publish this image", http.StatusForbidden)
		case errors.Is(err, imagesSvc.ErrBadRequest):
			respondError(w, "Image generation not completed yet", http.StatusBadRequest)
		default:
			respondError(w, "Failed to publish image", http.StatusInternalServerError)
		}
		return
	}

	respondJSON(w, map[string]any{
		"message":    "Image published successfully",
		"image_id":   imageID,
		"visibility": visibility,
	}, http.StatusCreated)
}

// HandleGetPublicImages handles GET /images/public
func (h *ImageHandler) HandleGetPublicImages(w http.ResponseWriter, r *http.Request) {
	params := dto.ParsePaginationParams(r, 20)

	var userID *uuid.UUID
	if claims, err := internalAuth.GetUserFromContext(r.Context()); err == nil {
		userID = &claims.UserID
	}

	items, hasMore, err := h.svc.GetPublicImages(r.Context(), userID, params)
	if err != nil {
		respondError(w, "Failed to fetch images", http.StatusInternalServerError)
		return
	}

	respondJSON(w, dto.PublicImagesResponseDTO{
		Images:  items,
		HasMore: hasMore,
		Offset:  params.Offset,
		Limit:   params.Limit,
	}, http.StatusOK)
}

// HandleGetImageDetail handles GET /images/{image_id}
func (h *ImageHandler) HandleGetImageDetail(w http.ResponseWriter, r *http.Request) {
	imageID, err := uuid.Parse(chi.URLParam(r, "image_id"))
	if err != nil {
		respondError(w, "invalid image_id", http.StatusBadRequest)
		return
	}

	detail, err := h.svc.GetImageByID(r.Context(), imageID)
	if err != nil {
		if errors.Is(err, imagesSvc.ErrNotFound) {
			respondError(w, "image not found", http.StatusNotFound)
			return
		}
		respondError(w, "Failed to fetch image", http.StatusInternalServerError)
		return
	}

	respondJSON(w, detail, http.StatusOK)
}

// HandleGetMyImages handles GET /images/me
func (h *ImageHandler) HandleGetMyImages(w http.ResponseWriter, r *http.Request) {
	claims, err := internalAuth.GetUserFromContext(r.Context())
	if err != nil {
		respondError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	visibility := r.URL.Query().Get("visibility")
	if visibility != "public" && visibility != "private" {
		visibility = "public"
	}

	params := dto.ParsePaginationParams(r, 20)

	items, hasMore, err := h.svc.GetMyImages(r.Context(), claims.UserID, visibility, params)
	if err != nil {
		respondError(w, "Failed to fetch images", http.StatusInternalServerError)
		return
	}

	respondJSON(w, dto.PublicImagesResponseDTO{
		Images:  items,
		HasMore: hasMore,
		Offset:  params.Offset,
		Limit:   params.Limit,
	}, http.StatusOK)
}

// HandleLikeImage handles POST /images/{image_id}/like
func (h *ImageHandler) HandleLikeImage(w http.ResponseWriter, r *http.Request) {
	claims, err := internalAuth.GetUserFromContext(r.Context())
	if err != nil {
		respondError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	imageID, err := uuid.Parse(chi.URLParam(r, "image_id"))
	if err != nil {
		respondError(w, "invalid image_id", http.StatusBadRequest)
		return
	}

	if err := h.svc.LikeImage(r.Context(), claims.UserID, imageID); err != nil {
		switch {
		case errors.Is(err, imagesSvc.ErrNotFound):
			respondError(w, "image not found", http.StatusNotFound)
		case errors.Is(err, imagesSvc.ErrConflict):
			respondError(w, "already liked", http.StatusConflict)
		default:
			respondError(w, "failed to like image", http.StatusInternalServerError)
		}
		return
	}

	respondJSON(w, map[string]string{"message": "liked"}, http.StatusOK)
}

// HandleUnlikeImage handles DELETE /images/{image_id}/like
func (h *ImageHandler) HandleUnlikeImage(w http.ResponseWriter, r *http.Request) {
	claims, err := internalAuth.GetUserFromContext(r.Context())
	if err != nil {
		respondError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	imageID, err := uuid.Parse(chi.URLParam(r, "image_id"))
	if err != nil {
		respondError(w, "invalid image_id", http.StatusBadRequest)
		return
	}

	if err := h.svc.UnlikeImage(r.Context(), claims.UserID, imageID); err != nil {
		if errors.Is(err, imagesSvc.ErrNotFound) {
			respondError(w, "like not found", http.StatusNotFound)
			return
		}
		respondError(w, "failed to unlike image", http.StatusInternalServerError)
		return
	}

	respondJSON(w, map[string]string{"message": "unliked"}, http.StatusOK)
}

// HandleCheckLiked handles GET /images/{image_id}/liked
func (h *ImageHandler) HandleCheckLiked(w http.ResponseWriter, r *http.Request) {
	claims, err := internalAuth.GetUserFromContext(r.Context())
	if err != nil {
		respondError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	imageID, err := uuid.Parse(chi.URLParam(r, "image_id"))
	if err != nil {
		respondError(w, "invalid image_id", http.StatusBadRequest)
		return
	}

	liked, err := h.svc.HasUserLikedImage(r.Context(), claims.UserID, imageID)
	if err != nil {
		respondError(w, "failed to check like status", http.StatusInternalServerError)
		return
	}

	respondJSON(w, map[string]bool{"liked": liked}, http.StatusOK)
}
