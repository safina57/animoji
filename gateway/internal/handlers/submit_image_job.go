package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/internal/dto"
	"github.com/safina57/animoji/gateway/internal/messaging"
	"github.com/safina57/animoji/gateway/internal/models"
	"github.com/safina57/animoji/gateway/pkg/cache"
	"github.com/safina57/animoji/gateway/pkg/logger"
	"github.com/safina57/animoji/gateway/pkg/storage"
)

// HandleSubmitJob handles image upload, validation, storage, and job queue submission.
func HandleSubmitJob(w http.ResponseWriter, r *http.Request) {
	claims, info, prompt, ok := parseImageUpload(w, r)
	if !ok {
		return
	}
	defer info.ClearData()

	jobID := uuid.New().String()
	ctx := r.Context()

	minioService := storage.NewMinIOService()
	inputKey, err := minioService.UploadTmpOriginal(ctx, jobID, info.Data, info.Extension, info.MIMEType)
	if err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Msg("Failed to upload image to storage")
		respondError(w, "Failed to store image", http.StatusInternalServerError)
		return
	}

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
		logger.Error().Err(err).Str("job_id", jobID).Msg("Failed to cache job metadata in Redis")
	}

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
		logger.Error().Err(err).Str("job_id", jobID).Msg("Failed to serialize NATS message")
		respondError(w, "Failed to submit job", http.StatusInternalServerError)
		return
	}

	if err := natsClient.Publish(constants.NatsSubjectGenerate, payload); err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Msg("Failed to publish job to NATS")
		respondError(w, "Failed to submit job", http.StatusInternalServerError)
		return
	}

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
		Msg("Image job submitted successfully")

	respondJSON(w, dto.SubmitJobResponse{JobID: jobID, Message: "Job submitted successfully"}, http.StatusAccepted)
}

// HandleHealth returns the health status of the API.
func HandleHealth(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, map[string]string{"status": "healthy"}, http.StatusOK)
}
