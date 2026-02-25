package handlers

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/dustin/go-humanize"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/pkg/imageinfo"
)

// ParseImageUpload parses a multipart form upload, validates the image, and returns
// the parsed ImageInfo and prompt. It writes error responses directly and returns
// ok=false on any failure so the caller can return immediately.
func ParseImageUpload(w http.ResponseWriter, r *http.Request) (info *imageinfo.ImageInfo, prompt string, ok bool) {
	if err := r.ParseMultipartForm(constants.MaxUploadSize); err != nil {
		RespondError(w, fmt.Sprintf("File too large (max %s)", humanize.Bytes(uint64(constants.MaxUploadSize))), http.StatusBadRequest)
		return nil, "", false
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		RespondError(w, "No image provided", http.StatusBadRequest)
		return nil, "", false
	}
	defer file.Close()

	prompt = r.FormValue("prompt")
	if prompt == "" {
		RespondError(w, "Prompt is required", http.StatusBadRequest)
		return nil, "", false
	}

	processor := imageinfo.NewImageProcessor(imageinfo.DefaultConfig())
	info, err = processor.ProcessReader(file, header.Filename, header.Size)
	if err != nil {
		if errors.Is(err, imageinfo.ErrFileTooLarge) {
			RespondError(w, err.Error(), http.StatusRequestEntityTooLarge)
			return nil, "", false
		}
		if errors.Is(err, imageinfo.ErrInvalidExtension) || errors.Is(err, imageinfo.ErrInvalidMIMEType) {
			RespondError(w, err.Error(), http.StatusUnsupportedMediaType)
			return nil, "", false
		}
		if errors.Is(err, imageinfo.ErrCannotDecodeImage) {
			RespondError(w, "Invalid or corrupted image file", http.StatusBadRequest)
			return nil, "", false
		}
		RespondError(w, fmt.Sprintf("Image validation failed: %v", err), http.StatusBadRequest)
		return nil, "", false
	}

	return info, prompt, true
}
