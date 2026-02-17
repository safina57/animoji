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
	"github.com/safina57/animoji/gateway/pkg/thumbnail"
)

// PublishImageHandler handles the publish image endpoint
type PublishImageHandler struct {
	repo *repository.Repository
}

// NewPublishImageHandler creates a new publish image handler
func NewPublishImageHandler(repo *repository.Repository) *PublishImageHandler {
	return &PublishImageHandler{
		repo: repo,
	}
}

// HandlePublishImage publishes a generated image to the database
// POST /images/{job_id}/publish?visibility=public|private
func (h *PublishImageHandler) HandlePublishImage(w http.ResponseWriter, r *http.Request) {
	// Extract authenticated user
	claims, err := auth.GetUserFromContext(r.Context())
	if err != nil {
		respondError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Extract job_id from URL
	jobID := chi.URLParam(r, "job_id")
	if jobID == "" {
		respondError(w, "job_id is required", http.StatusBadRequest)
		return
	}

	// Extract visibility from query param (default: private)
	visibility := r.URL.Query().Get("visibility")
	if visibility == "" {
		visibility = models.VisibilityPrivate
	}

	// Validate visibility
	if visibility != models.VisibilityPublic && visibility != models.VisibilityPrivate {
		respondError(w, "visibility must be 'public' or 'private'", http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	// Retrieve job metadata from Redis
	redisClient := cache.MustGetClient()
	metadata, err := redisClient.GetJobMetadata(ctx, jobID)
	if err != nil {
		logger.Error().Err(err).
			Str("job_id", jobID).
			Msg("Failed to retrieve job metadata from Redis")
		respondError(w, "Job not found or expired", http.StatusNotFound)
		return
	}

	// Verify the user owns this job
	if metadata.UserID != claims.UserID {
		logger.Warn().
			Str("job_id", jobID).
			Str("metadata_user_id", metadata.UserID.String()).
			Str("request_user_id", claims.UserID.String()).
			Msg("User attempted to publish another user's image")
		respondError(w, "Unauthorized to publish this image", http.StatusForbidden)
		return
	}

	// Verify generated images exist
	if len(metadata.GeneratedKeys) == 0 {
		respondError(w, "Image generation not completed yet", http.StatusBadRequest)
		return
	}

	minioService := storage.NewMinIOService()
	exists, err := minioService.CheckResultExists(ctx, jobID)
	if err != nil || !exists {
		logger.Error().Err(err).
			Str("job_id", jobID).
			Msg("Generated image does not exist in storage")
		respondError(w, "Generated image not found", http.StatusNotFound)
		return
	}
	latestGeneratedKey := metadata.GeneratedKeys[len(metadata.GeneratedKeys)-1]

	// Create image record in database via repository
	image := &models.Image{
		UserID:       metadata.UserID,
		JobID:        metadata.JobID,
		Prompts:      metadata.Prompts,       // All prompts from iteration chain
		OriginalKey:  metadata.OriginalKey,
		GeneratedKey: latestGeneratedKey,     // Latest iteration result
		Width:        metadata.Width,
		Height:       metadata.Height,
		Visibility:   visibility,
		IterationNum: metadata.IterationNum,
		// Thumbnail key will be updated by background goroutine
	}

	if err := h.repo.CreateImage(ctx, image); err != nil {
		logger.Error().Err(err).
			Str("job_id", jobID).
			Msg("Failed to create image record in database")
		respondError(w, "Failed to publish image", http.StatusInternalServerError)
		return
	}

	// Launch background goroutine for thumbnail generation (use latest result)
	go h.generateThumbnailAsync(jobID, latestGeneratedKey, image.ID)

	// Launch background goroutine for Redis cleanup (with timeout to prevent leaks)
	go func(jobID string) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := redisClient.DeleteJobMetadata(ctx, jobID); err != nil {
			logger.Error().Err(err).
				Str("job_id", jobID).
				Msg("Failed to delete job metadata from Redis")
		} else {
			logger.Debug().
				Str("job_id", jobID).
				Msg("Job metadata deleted from Redis")
		}
	}(jobID)

	logger.Info().
		Str("job_id", jobID).
		Str("user_id", claims.UserID.String()).
		Str("image_id", image.ID.String()).
		Str("visibility", visibility).
		Msg("Image published successfully")

	// Return success response
	respondJSON(w, map[string]any{
		"message":    "Image published successfully",
		"image_id":   image.ID,
		"visibility": visibility,
	}, http.StatusCreated)
}

// generateThumbnailAsync generates a thumbnail in the background
func (h *PublishImageHandler) generateThumbnailAsync(jobID, generatedKey string, imageID uuid.UUID) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	logger.Info().
		Str("job_id", jobID).
		Str("image_id", imageID.String()).
		Msg("Starting background thumbnail generation")

	// Initialize services
	minioService := storage.NewMinIOService()
	thumbnailService := thumbnail.NewThumbnailService(minioService)

	// Generate thumbnail
	thumbnailKey, err := thumbnailService.GenerateThumbnail(ctx, jobID, generatedKey)
	if err != nil {
		logger.Error().Err(err).
			Str("job_id", jobID).
			Msg("Failed to generate thumbnail")
		return
	}

	// Update image record with thumbnail key via repository
	if err := h.repo.UpdateImageThumbnailKey(ctx, imageID, thumbnailKey); err != nil {
		logger.Error().Err(err).
			Str("job_id", jobID).
			Msg("Failed to update image record with thumbnail key")
		return
	}

	logger.Info().
		Str("job_id", jobID).
		Str("thumbnail_key", thumbnailKey).
		Msg("Thumbnail generated and database updated successfully")
}
