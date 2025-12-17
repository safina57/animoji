package imageinfo

type Service struct {
	validator *Validator
	extractor *MetadataExtractor
}

// NewService creates a new image info service
func NewService(config ValidationConfig) *Service {
	return &Service{
		validator: NewValidator(config),
		extractor: NewMetadataExtractor(),
	}
}

// Process validates an image and extracts its metadata
// Returns ImageInfo if successful, or an error if validation fails
func (s *Service) Process(path string) (*ImageInfo, error) {
	// Step 1: Validate file (size, extension)
	if err := s.validator.ValidateFile(path); err != nil {
		return nil, err
	}

	// Step 2: Extract metadata (including MIME type and dimensions)
	info, err := s.extractor.Extract(path)
	if err != nil {
		return nil, err
	}

	// Step 3: Validate MIME type (actual content type)
	if err := s.validator.ValidateMIMEType(info.MIMEType); err != nil {
		return nil, err
	}

	return info, nil
}
