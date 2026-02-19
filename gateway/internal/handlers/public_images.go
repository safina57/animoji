package handlers

import (
	"net/http"
	"strconv"

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
	limit := 20
	offset := 0

	if v := r.URL.Query().Get("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			if n < 1 {
				n = 1
			} else if n > 50 {
				n = 50
			}
			limit = n
		}
	}
	if v := r.URL.Query().Get("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 {
			offset = n
		}
	}

	images, err := h.repo.GetPublicImages(r.Context(), dto.PaginationParams{Limit: limit, Offset: offset})
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
		items = append(items, dto.NewImageFeedItemDTO(img, h.storageService, likedMap))
	}

	respondJSON(w, dto.PublicImagesResponseDTO{
		Images:  items,
		HasMore: len(images) == limit,
		Offset:  offset,
		Limit:   limit,
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

	respondJSON(w, dto.NewImageDetailDTO(img, h.storageService), http.StatusOK)
}
