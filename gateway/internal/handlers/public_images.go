package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/auth"
	"github.com/safina57/animoji/gateway/internal/dto"
	"github.com/safina57/animoji/gateway/internal/repository"
	"github.com/safina57/animoji/gateway/pkg/storage"
)

// PublicImagesHandler handles public image feed endpoints
type PublicImagesHandler struct {
	repo           *repository.Repository
	storageService *storage.MinIOService
}

// NewPublicImagesHandler creates a new public images handler
func NewPublicImagesHandler(repo *repository.Repository, storageService *storage.MinIOService) *PublicImagesHandler {
	return &PublicImagesHandler{repo: repo, storageService: storageService}
}

// HandleGetPublicImages returns a paginated list of public images.
// When the request carries a valid JWT, each item includes is_liked_by_user.
// GET /images/public
func (h *PublicImagesHandler) HandleGetPublicImages(w http.ResponseWriter, r *http.Request) {
	params := dto.ParsePaginationParams(r, 20)

	images, err := h.repo.GetPublicImages(r.Context(), params)
	if err != nil {
		respondError(w, "Failed to fetch images", http.StatusInternalServerError)
		return
	}

	// Single batch query to resolve like state for authenticated users
	var likedMap map[uuid.UUID]bool
	if claims, err := auth.GetUserFromContext(r.Context()); err == nil {
		ids := make([]uuid.UUID, len(images))
		for i, img := range images {
			ids[i] = img.ID
		}
		if m, err := h.repo.GetLikedImageIDs(r.Context(), claims.UserID, ids); err == nil {
			likedMap = m
		}
	}

	items := make([]dto.ImageFeedItemDTO, 0, len(images))
	for _, img := range images {
		item, err := dto.NewImageFeedItemDTO(r.Context(), img, h.storageService, likedMap)
		if err != nil {
			respondError(w, "Failed to build image response", http.StatusInternalServerError)
			return
		}
		items = append(items, item)
	}

	respondJSON(w, dto.PublicImagesResponseDTO{
		Images:  items,
		HasMore: len(images) == params.Limit,
		Offset:  params.Offset,
		Limit:   params.Limit,
	}, http.StatusOK)
}

// HandleGetImageDetail returns a single image by ID
// GET /images/{image_id}
func (h *PublicImagesHandler) HandleGetImageDetail(w http.ResponseWriter, r *http.Request) {
	imageID, err := uuid.Parse(chi.URLParam(r, "image_id"))
	if err != nil {
		respondError(w, "invalid image_id", http.StatusBadRequest)
		return
	}

	img, err := h.repo.GetImageByID(r.Context(), imageID)
	if err != nil {
		if repository.IsNotFoundError(err) {
			respondError(w, "image not found", http.StatusNotFound)
			return
		}
		respondError(w, "Failed to fetch image", http.StatusInternalServerError)
		return
	}

	detail, err := dto.NewImageDetailDTO(r.Context(), img, h.storageService)
	if err != nil {
		respondError(w, "Failed to build image response", http.StatusInternalServerError)
		return
	}

	respondJSON(w, detail, http.StatusOK)
}
