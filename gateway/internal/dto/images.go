package dto

import "github.com/google/uuid"

// SubmitJobResponse is returned when a job is successfully submitted to the queue
type SubmitJobResponse struct {
	JobID   string `json:"job_id"`
	Message string `json:"message"`
}

// JobStatusResponse is returned by the job status endpoint
type JobStatusResponse struct {
	JobID       string `json:"job_id"`
	Status      string `json:"status"`
	OriginalURL string `json:"original_url,omitempty"`
	ResultURL   string `json:"result_url,omitempty"`
}

// UpdateImageRequest represents a request to update image metadata
type UpdateImageRequest struct {
	ID          uuid.UUID `json:"id" validate:"required,uuid"`
	Prompt      string    `json:"prompt" validate:"omitempty,max=500"`
	IsPublic    *bool     `json:"is_public"`
	Description string    `json:"description" validate:"omitempty,max=1000"`
}
