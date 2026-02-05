package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/dustin/go-humanize"
	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/internal/messaging"
	"github.com/safina57/animoji/gateway/internal/models"
	"github.com/safina57/animoji/gateway/pkg/imageinfo"
	"github.com/safina57/animoji/gateway/pkg/logger"
	"github.com/safina57/animoji/gateway/pkg/storage"
)

// HandleSubmitJob handles image upload, validation, storage, and job queue submission
func HandleSubmitJob(w http.ResponseWriter, r *http.Request) {
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

	// Upload original image to storage
	ctx := r.Context()
	inputKey, err := minioService.UploadOriginalImage(ctx, jobID, info.Data, header.Filename, info.MIMEType)
	if err != nil {
		logger.Error().Err(err).
			Str("job_id", jobID).
			Msg("Failed to upload image to storage")
		respondError(w, "Failed to store image", http.StatusInternalServerError)
		return
	}
	info.ClearData()

	// Publish job to NATS queue for AI processing
	natsClient := messaging.MustGetClient()
	message := models.NatsJobMessage{
		JobID:    jobID,
		InputKey: inputKey,
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
		Str("prompt", prompt).
		Str("input_key", inputKey).
		Int("width", info.Width).
		Int("height", info.Height).
		Str("mime_type", info.MIMEType).
		Str("size", info.ReadableSize).
		Msg("Job submitted and image stored successfully")

	// Return response
	response := models.SubmitJobResponse{
		JobID:   jobID,
		Status:  constants.StatusQueued,
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

// respondJSON sends a JSON response
func respondJSON(w http.ResponseWriter, data interface{}, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// respondError sends a JSON error response
func respondError(w http.ResponseWriter, message string, statusCode int) {
	respondJSON(w, map[string]string{
		"error": message,
	}, statusCode)
}
