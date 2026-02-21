package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/dustin/go-humanize"
	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/auth"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/internal/dto"
	"github.com/safina57/animoji/gateway/internal/messaging"
	"github.com/safina57/animoji/gateway/internal/models"
	"github.com/safina57/animoji/gateway/pkg/cache"
	"github.com/safina57/animoji/gateway/pkg/imageinfo"
	"github.com/safina57/animoji/gateway/pkg/logger"
	"github.com/safina57/animoji/gateway/pkg/storage"
)

// HandleSubmitJob handles image upload, validation, storage, and job queue submission
func HandleSubmitJob(w http.ResponseWriter, r *http.Request) {
	// Extract authenticated user from context
	claims, err := auth.GetUserFromContext(r.Context())
	if err != nil {
		respondError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Initialize MinIO storage service
	minioService := storage.NewMinIOService()

	// Parse multipart form with size limit
	if err := r.ParseMultipartForm(constants.MaxUploadSize); err != nil {
		respondError(w, fmt.Sprintf("File too large (max %s)", humanize.Bytes(uint64(constants.MaxUploadSize))), http.StatusBadRequest)
		return
	}

	// Get file from form
	file, header, err := r.FormFile("image")
	if err != nil {
		respondError(w, "No image provided", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Get prompt from form field
	prompt := r.FormValue("prompt")
	if prompt == "" {
		respondError(w, "Prompt is required", http.StatusBadRequest)
		return
	}

	// Validate the image using our imageinfo package
	processor := imageinfo.NewImageProcessor(imageinfo.DefaultConfig())
	info, err := processor.ProcessReader(file, header.Filename, header.Size)
	if err != nil {
		// Return specific error based on validation failure
		if errors.Is(err, imageinfo.ErrFileTooLarge) {
			respondError(w, err.Error(), http.StatusRequestEntityTooLarge)
			return
		}
		if errors.Is(err, imageinfo.ErrInvalidExtension) || errors.Is(err, imageinfo.ErrInvalidMIMEType) {
			respondError(w, err.Error(), http.StatusUnsupportedMediaType)
			return
		}
		if errors.Is(err, imageinfo.ErrCannotDecodeImage) {
			respondError(w, "Invalid or corrupted image file", http.StatusBadRequest)
			return
		}
		respondError(w, fmt.Sprintf("Image validation failed: %v", err), http.StatusBadRequest)
		return
	}

	// Generate job ID
	jobID := uuid.New().String()

	// Upload original image to temporary storage
	ctx := r.Context()
	inputKey, err := minioService.UploadTmpOriginal(ctx, jobID, info.Data, info.Extension, info.MIMEType)
	if err != nil {
		logger.Error().Err(err).
			Str("job_id", jobID).
			Msg("Failed to upload image to storage")
		respondError(w, "Failed to store image", http.StatusInternalServerError)
		return
	}
	info.ClearData()

	// Cache job metadata in Redis
	redisClient := cache.MustGetClient()
	metadata := &cache.JobMetadata{
		JobID:         jobID,
		UserID:        claims.UserID,
		Prompts:       []string{prompt},
		OriginalKey:   inputKey,
		OriginalExt:   info.Extension,
		GeneratedKeys: []string{},
		Width:         info.Width,
		Height:        info.Height,
		IterationNum:  0,
		CreatedAt:     time.Now(),
	}
	if err := redisClient.SetJobMetadata(ctx, jobID, metadata); err != nil {
		logger.Error().Err(err).
			Str("job_id", jobID).
			Msg("Failed to cache job metadata in Redis")
	}

	// Publish job to NATS queue for AI processing
	natsClient := messaging.MustGetClient()
	message := models.NatsJobMessage{
		JobID:        jobID,
		InputKey:     inputKey,
		Prompt:       prompt,
		Width:        info.Width,
		Height:       info.Height,
		MIMEType:     info.MIMEType,
		IterationNum: 0, 
	}
	payload, err := json.Marshal(message)
	if err != nil {
		logger.Error().Err(err).
			Str("job_id", jobID).
			Msg("Failed to serialize NATS message")
		respondError(w, "Failed to submit job", http.StatusInternalServerError)
		return
	}

	if err := natsClient.Publish(constants.NatsSubjectGenerate, payload); err != nil {
		logger.Error().Err(err).
			Str("job_id", jobID).
			Str("subject", constants.NatsSubjectGenerate).
			Msg("Failed to publish job to NATS")
		respondError(w, "Failed to submit job", http.StatusInternalServerError)
		return
	}

	// Log job submission
	logger.Info().
		Str("job_id", jobID).
		Str("user_id", claims.UserID.String()).
		Str("email", claims.Email).
		Str("prompt", prompt).
		Str("input_key", inputKey).
		Int("width", info.Width).
		Int("height", info.Height).
		Str("mime_type", info.MIMEType).
		Str("size", info.ReadableSize).
		Msg("Job submitted and image stored successfully")

	// Return response
	response := dto.SubmitJobResponse{
		JobID:   jobID,
		Message: "Job submitted successfully",
	}

	respondJSON(w, response, http.StatusAccepted)
}

// HandleHealth returns the health status of the API
func HandleHealth(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, map[string]string{
		"status": "healthy",
	}, http.StatusOK)
}
