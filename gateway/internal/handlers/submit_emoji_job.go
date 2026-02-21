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

// HandleSubmitEmojiJob handles emoji job submission: validates the image,
// uploads the original, caches metadata in Redis, and fans out 3 NATS
// messages (one per emotion: happy, sad, surprised).
func HandleSubmitEmojiJob(w http.ResponseWriter, r *http.Request) {
	claims, err := auth.GetUserFromContext(r.Context())
	if err != nil {
		respondError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	minioService := storage.NewMinIOService()

	if err := r.ParseMultipartForm(constants.MaxUploadSize); err != nil {
		respondError(w, fmt.Sprintf("File too large (max %s)", humanize.Bytes(uint64(constants.MaxUploadSize))), http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		respondError(w, "No image provided", http.StatusBadRequest)
		return
	}
	defer file.Close()

	prompt := r.FormValue("prompt")
	if prompt == "" {
		respondError(w, "Prompt is required", http.StatusBadRequest)
		return
	}

	processor := imageinfo.NewImageProcessor(imageinfo.DefaultConfig())
	info, err := processor.ProcessReader(file, header.Filename, header.Size)
	if err != nil {
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

	jobID := uuid.New().String()
	ctx := r.Context()

	// Upload original to tmp/{job_id}/emoji_original.{ext}
	inputKey := fmt.Sprintf("%s%s/emoji_original.%s", constants.PrefixTmp, jobID, info.Extension)
	if err := minioService.UploadFile(ctx, inputKey, info.Data, info.MIMEType); err != nil {
		logger.Error().Err(err).Str("job_id", jobID).Msg("Failed to upload emoji original to storage")
		respondError(w, "Failed to store image", http.StatusInternalServerError)
		return
	}
	info.ClearData()

	// Cache emoji job metadata in Redis
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

	// Publish a single NATS message — the worker generates all 3 emotion variants
	// from one shared character description to ensure visual consistency.
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

	respondJSON(w, dto.SubmitJobResponse{
		JobID:   jobID,
		Message: "Emoji job submitted successfully",
	}, http.StatusAccepted)
}
