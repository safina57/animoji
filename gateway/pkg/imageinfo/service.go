package imageinfo

import "io"

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

// Process validates an image and extracts its metadata
// Returns ImageInfo if successful, or an error if validation fails
func (p *ImageProcessor) Process(path string) (*ImageInfo, error) {
	// Step 1: Validate file (size, extension)
	if err := p.validator.ValidateFile(path); err != nil {
		return nil, err
	}

	// Step 2: Extract metadata (including MIME type and dimensions)
	info, err := p.extractor.Extract(path)
	if err != nil {
		return nil, err
	}

	// Step 3: Validate MIME type (actual content type)
	if err := p.validator.ValidateMIMEType(info.MIMEType); err != nil {
		return nil, err
	}

	return info, nil
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

	return info, nil
}
