package handlers

import (
	"net/http"

	"github.com/safina57/animoji/gateway/internal/auth"
	"github.com/safina57/animoji/gateway/internal/dto"
	"github.com/safina57/animoji/gateway/internal/repository"
	"github.com/safina57/animoji/gateway/pkg/storage"
)

// UserEmojisHandler handles the authenticated user's emoji pack endpoints.
type UserEmojisHandler struct {
	repo           *repository.Repository
	storageService *storage.MinIOService
}

// NewUserEmojisHandler creates a new user emojis handler.
func NewUserEmojisHandler(repo *repository.Repository, storageService *storage.MinIOService) *UserEmojisHandler {
	return &UserEmojisHandler{repo: repo, storageService: storageService}
}

// HandleGetMyEmojiPacks returns a paginated list of the authenticated user's published emoji packs.
// GET /emojis/me?limit=20&offset=0
func (h *UserEmojisHandler) HandleGetMyEmojiPacks(w http.ResponseWriter, r *http.Request) {
	claims, err := auth.GetUserFromContext(r.Context())
	if err != nil {
		respondError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	params := dto.ParsePaginationParams(r, 20)

	packs, err := h.repo.GetUserEmojiPacks(r.Context(), claims.UserID, params)
	if err != nil {
		respondError(w, "Failed to fetch emoji packs", http.StatusInternalServerError)
		return
	}

	items := make([]dto.EmojiPackDTO, len(packs))
	for i, pack := range packs {
		items[i] = dto.NewEmojiPackDTO(pack, h.storageService)
	}

	respondJSON(w, dto.EmojiPacksResponseDTO{
		Packs:   items,
		HasMore: len(packs) == params.Limit,
		Offset:  params.Offset,
		Limit:   params.Limit,
	}, http.StatusOK)
}
