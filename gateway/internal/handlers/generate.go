package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/models"
	"github.com/safina57/animoji/gateway/pkg/imageinfo"
)

// HandleGenerate processes image upload and creates a generation job
func HandleGenerate(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form with size limit
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		respondError(w, "File too large (max 10MB)", http.StatusBadRequest)
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
	// For now, just log the job creation
	fmt.Printf("✓ Job created: %s\n", jobID)
	fmt.Printf("  Prompt: %s\n", prompt)
	fmt.Printf("  Image: %dx%d %s (%s)\n", info.Width, info.Height, info.MIMEType, info.ReadableSize)

	// Return response
	response := models.GenerateResponse{
		JobID:   jobID,
		Status:  models.StatusQueued,
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
