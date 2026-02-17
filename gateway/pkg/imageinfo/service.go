package imageinfo

import (
	"bytes"
	"fmt"
	"io"

	"github.com/disintegration/imaging"
	"github.com/dustin/go-humanize"
)

// ImageProcessor orchestrates image validation and metadata extraction
type ImageProcessor struct {
	validator *ImageValidator
	extractor *ImageMetadataExtractor
}

// NewImageProcessor creates a new image processor
func NewImageProcessor(config ValidationConfig) *ImageProcessor {
	return &ImageProcessor{
		validator: NewImageValidator(config),
		extractor: NewImageMetadataExtractor(),
	}
}

// ProcessReader validates an image from an io.Reader and extracts its metadata
// Returns ImageInfo if successful, or an error if validation fails
func (p *ImageProcessor) ProcessReader(r io.Reader, filename string, size int64) (*ImageInfo, error) {
	// Step 1: Buffer the entire content into memory
	data, err := io.ReadAll(r)
	if err != nil {
		return nil, err
	}

	// Verify size matches (protect against size spoofing)
	if int64(len(data)) != size {
		size = int64(len(data))
	}

	// Step 2: Validate buffered content (size, extension, MIME type)
	if err := p.validator.ValidateBufferedContent(data, filename, size); err != nil {
		return nil, err
	}

	// Step 3: Extract metadata
	info, err := p.extractor.ExtractFromData(data, filename, size)
	if err != nil {
		return nil, err
	}

	// Step 4: Validate MIME type (from actual content)
	if err := p.validator.ValidateMIMEType(info.MIMEType); err != nil {
		return nil, err
	}

	// Step 5: If dimensions are outside the valid range, clamp and resize image bytes.
	if err := p.validator.ValidateDimensions(info.Width, info.Height); err != nil {
		targetW, targetH := p.validator.ClampDimensions(info.Width, info.Height)

		format, _ := imaging.FormatFromFilename("x." + info.Extension)
		
		resized, err := resizeImageData(info.Data, targetW, targetH, format)
		if err != nil {
			return nil, fmt.Errorf("failed to resize image to valid dimensions: %w", err)
		}
		info.Data = resized
		info.Width = targetW
		info.Height = targetH
		info.SizeBytes = int64(len(resized))
		info.ReadableSize = humanize.Bytes(uint64(len(resized)))
	}

	return info, nil
}

// resizeImageData decodes image bytes, resizes to the target dimensions
func resizeImageData(data []byte, width, height int, format imaging.Format) ([]byte, error) {
	img, err := imaging.Decode(bytes.NewReader(data), imaging.AutoOrientation(true))
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}

	resized := imaging.Resize(img, width, height, imaging.Lanczos)

	var buf bytes.Buffer
	if err := imaging.Encode(&buf, resized, format); err != nil {
		return nil, fmt.Errorf("failed to encode resized image: %w", err)
	}

	return buf.Bytes(), nil
}
