package handlers

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/auth"
	"github.com/safina57/animoji/gateway/internal/dto"
	"github.com/safina57/animoji/gateway/pkg/storage"

	"github.com/safina57/animoji/gateway/internal/repository"
)

// UserImagesHandler handles the authenticated user's own image endpoints
type UserImagesHandler struct {
	repo           *repository.Repository
	storageService *storage.MinIOService
}

// NewUserImagesHandler creates a new user images handler
func NewUserImagesHandler(repo *repository.Repository, storageService *storage.MinIOService) *UserImagesHandler {
	return &UserImagesHandler{repo: repo, storageService: storageService}
}

// HandleGetMyImages returns a paginated list of the authenticated user's images.
// GET /images/me?visibility=public|private&limit=20&offset=0
func (h *UserImagesHandler) HandleGetMyImages(w http.ResponseWriter, r *http.Request) {
	claims, err := auth.GetUserFromContext(r.Context())
	if err != nil {
		respondError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse visibility — default "public", accept "public" or "private"
	visibility := r.URL.Query().Get("visibility")
	if visibility != "public" && visibility != "private" {
		visibility = "public"
	}

	params := dto.ParsePaginationParams(r, 20)

	images, err := h.repo.GetUserImages(r.Context(), claims.UserID, visibility, params)
	if err != nil {
		respondError(w, "Failed to fetch images", http.StatusInternalServerError)
		return
	}

	// Always populate is_liked_by_user for the owner viewing their own gallery
	ids := make([]uuid.UUID, len(images))
	for i, img := range images {
		ids[i] = img.ID
	}
	likedMap, _ := h.repo.GetLikedImageIDs(r.Context(), claims.UserID, ids)

	items := make([]dto.ImageFeedItemDTO, 0, len(images))
	for _, img := range images {
		items = append(items, dto.NewImageFeedItemDTO(img, h.storageService, likedMap))
	}

	respondJSON(w, dto.PublicImagesResponseDTO{
		Images:  items,
		HasMore: len(images) == params.Limit,
		Offset:  params.Offset,
		Limit:   params.Limit,
	}, http.StatusOK)
}
