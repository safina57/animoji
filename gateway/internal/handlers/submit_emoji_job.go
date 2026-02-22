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

// HandleSubmitEmojiJob handles emoji job submission: validates the image,
// uploads the original, caches metadata in Redis, and publishes a single
// NATS message for the worker to generate all emotion variants.
func HandleSubmitEmojiJob(w http.ResponseWriter, r *http.Request) {
	claims, info, prompt, ok := parseImageUpload(w, r)
	if !ok {
		return
	}
	defer info.ClearData()

	jobID := uuid.New().String()
	ctx := r.Context()

	minioService := storage.NewMinIOService()
	inputKey, err := minioService.UploadTmpEmojiOriginal(ctx, jobID, info.Data, info.Extension, info.MIMEType)
	if err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Msg("Failed to upload emoji original to storage")
		respondError(w, "Failed to store image", http.StatusInternalServerError)
		return
	}

	redisClient := cache.MustGetClient()
	metadata := &cache.EmojiJobMetadata{
		JobID:             jobID,
		UserID:            claims.UserID,
		Prompt:            prompt,
		OriginalKey:       inputKey,
		OriginalExt:       info.Extension,
		TotalVariants:     0, // updated by the worker via the "started" NATS event
		CompletedVariants: []cache.EmojiVariantResult{},
		CreatedAt:         time.Now(),
	}
	if err := redisClient.SetEmojiJobMetadata(ctx, jobID, metadata); err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Msg("Failed to cache emoji job metadata in Redis")
	}

	natsClient := messaging.MustGetClient()
	msg := models.EmojiNatsJobMessage{
		JobID:    jobID,
		InputKey: inputKey,
		Prompt:   prompt,
		MIMEType: info.MIMEType,
	}
	payload, err := json.Marshal(msg)
	if err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Msg("Failed to serialize emoji NATS message")
		respondError(w, "Failed to submit emoji job", http.StatusInternalServerError)
		return
	}

	if err := natsClient.Publish(constants.NatsSubjectEmojiGenerate, payload); err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Msg("Failed to publish emoji job to NATS")
		respondError(w, "Failed to submit emoji job", http.StatusInternalServerError)
		return
	}

	logger.Info().
		Str("job_id", jobID).
		Str("user_id", claims.UserID.String()).
		Str("prompt", prompt).
		Str("input_key", inputKey).
		Msg("Emoji job submitted successfully")

	respondJSON(w, dto.SubmitJobResponse{JobID: jobID, Message: "Emoji job submitted successfully"}, http.StatusAccepted)
}
