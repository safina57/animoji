package handlers

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/dustin/go-humanize"
	"github.com/safina57/animoji/gateway/internal/auth"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/pkg/imageinfo"
)

// parseImageUpload handles the shared auth + multipart parsing + image validation
// logic for image submission handlers. It writes error responses directly and
// returns ok=false on any failure so the caller can return immediately.
func parseImageUpload(w http.ResponseWriter, r *http.Request) (claims *auth.JWTClaims, info *imageinfo.ImageInfo, prompt string, ok bool) {
	claims, err := auth.GetUserFromContext(r.Context())
	if err != nil {
		respondError(w, "unauthorized", http.StatusUnauthorized)
		return nil, nil, "", false
	}

	if err := r.ParseMultipartForm(constants.MaxUploadSize); err != nil {
		respondError(w, fmt.Sprintf("File too large (max %s)", humanize.Bytes(uint64(constants.MaxUploadSize))), http.StatusBadRequest)
		return nil, nil, "", false
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		respondError(w, "No image provided", http.StatusBadRequest)
		return nil, nil, "", false
	}
	defer file.Close()

	prompt = r.FormValue("prompt")
	if prompt == "" {
		respondError(w, "Prompt is required", http.StatusBadRequest)
		return nil, nil, "", false
	}

	processor := imageinfo.NewImageProcessor(imageinfo.DefaultConfig())
	info, err = processor.ProcessReader(file, header.Filename, header.Size)
	if err != nil {
		if errors.Is(err, imageinfo.ErrFileTooLarge) {
			respondError(w, err.Error(), http.StatusRequestEntityTooLarge)
			return nil, nil, "", false
		}
		if errors.Is(err, imageinfo.ErrInvalidExtension) || errors.Is(err, imageinfo.ErrInvalidMIMEType) {
			respondError(w, err.Error(), http.StatusUnsupportedMediaType)
			return nil, nil, "", false
		}
		if errors.Is(err, imageinfo.ErrCannotDecodeImage) {
			respondError(w, "Invalid or corrupted image file", http.StatusBadRequest)
			return nil, nil, "", false
		}
		respondError(w, fmt.Sprintf("Image validation failed: %v", err), http.StatusBadRequest)
		return nil, nil, "", false
	}

	return claims, info, prompt, true
}
