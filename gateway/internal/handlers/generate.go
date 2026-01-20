package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/dustin/go-humanize"
	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/internal/models"
	"github.com/safina57/animoji/gateway/pkg/imageinfo"
	"github.com/safina57/animoji/gateway/pkg/logger"
)

// HandleGenerate processes image upload and creates a generation job
func HandleGenerate(w http.ResponseWriter, r *http.Request) {
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

	// TODO: Upload to MinIO and publish to NATS
	// Log the job creation
	logger.Info().
		Str("job_id", jobID).
		Str("prompt", prompt).
		Int("width", info.Width).
		Int("height", info.Height).
		Str("mime_type", info.MIMEType).
		Str("size", info.ReadableSize).
		Msg("Job created")

	// Return response
	response := models.GenerateResponse{
		JobID:   jobID,
		Status:  constants.StatusQueued,
		Message: "Image uploaded successfully",
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
