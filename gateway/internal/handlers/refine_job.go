package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/safina57/animoji/gateway/internal/auth"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/internal/dto"
	"github.com/safina57/animoji/gateway/internal/messaging"
	"github.com/safina57/animoji/gateway/internal/models"
	"github.com/safina57/animoji/gateway/pkg/cache"
	"github.com/safina57/animoji/gateway/pkg/logger"
)

// RefineJobRequest represents the request body for refinement
type RefineJobRequest struct {
	Prompt string `json:"prompt"`
}

// HandleRefineJob handles POST /jobs/{job_id}/refine
// Allows users to refine a generated image with additional prompts
func HandleRefineJob(w http.ResponseWriter, r *http.Request) {
	// Extract authenticated user from context
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

	// Parse request body
	var req RefineJobRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Prompt == "" {
		respondError(w, "Refinement prompt is required", http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	// Retrieve current job metadata from Redis (SAME job_id)
	redisClient := cache.MustGetClient()
	metadata, err := redisClient.GetJobMetadata(ctx, jobID)
	if err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Msg("Failed to retrieve job metadata")
		respondError(w, "Job not found or expired", http.StatusNotFound)
		return
	}

	// Verify user owns job
	if metadata.UserID != claims.UserID {
		logger.Warn().
			Str("job_id", jobID).
			Str("metadata_user_id", metadata.UserID.String()).
			Str("request_user_id", claims.UserID.String()).
			Msg("User attempted to refine another user's job")
		respondError(w, "Unauthorized to refine this job", http.StatusForbidden)
		return
	}

	// Verify job has at least one completed generation
	if len(metadata.GeneratedKeys) == 0 {
		respondError(w, "Job not completed yet, cannot refine", http.StatusBadRequest)
		return
	}

	// Append new prompt to prompts array
	metadata.Prompts = append(metadata.Prompts, req.Prompt)
	metadata.IterationNum++

	// Combine all prompts for AI processing
	combinedPrompt := strings.Join(metadata.Prompts, ". ")

	// Update metadata in Redis
	if err := redisClient.SetJobMetadata(ctx, jobID, metadata); err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Msg("Failed to update job metadata")
		respondError(w, "Failed to create refinement", http.StatusInternalServerError)
		return
	}

	// Publish to NATS with SAME job_id and iteration number
	natsClient := messaging.MustGetClient()
	message := models.NatsJobMessage{
		JobID:        jobID,
		InputKey:     metadata.OriginalKey,
		Prompt:       combinedPrompt,
		Width:        metadata.Width,
		Height:       metadata.Height,
		MIMEType:     "image/png",
		IterationNum: metadata.IterationNum,
	}

	payload, err := json.Marshal(message)
	if err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Msg("Failed to serialize NATS message")
		respondError(w, "Failed to submit refinement", http.StatusInternalServerError)
		return
	}

	if err := natsClient.Publish(constants.NatsSubjectGenerate, payload); err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Msg("Failed to publish refinement to NATS")
		respondError(w, "Failed to submit refinement", http.StatusInternalServerError)
		return
	}

	// Log successful refinement submission
	logger.Info().
		Str("job_id", jobID).
		Str("user_id", claims.UserID.String()).
		Int("iteration_num", metadata.IterationNum).
		Str("refinement_prompt", req.Prompt).
		Msg("Refinement submitted successfully")

	// Return SAME job_id
	response := dto.SubmitJobResponse{
		JobID:   jobID, // Return SAME job_id
		Message: fmt.Sprintf("Refinement %d submitted successfully", metadata.IterationNum),
	}

	respondJSON(w, response, http.StatusAccepted)
}
