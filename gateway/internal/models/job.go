package models

import "time"

// GenerateRequest represents the request payload for image generation
type GenerateRequest struct {
	Prompt string `json:"prompt"`
}

// GenerateResponse is returned when a generation job is created
type GenerateResponse struct {
	JobID   string `json:"job_id"`
	Status  string `json:"status"`
	Message string `json:"message"`
}

// Job represents a generation job with all its metadata
type Job struct {
	ID        string    `json:"id"`
	Status    string    `json:"status"`
	Prompt    string    `json:"prompt"`
	InputKey  string    `json:"input_key"`
	OutputKey string    `json:"output_key,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Job status constants
const (
	StatusQueued     = "queued"
	StatusProcessing = "processing"
	StatusCompleted  = "completed"
	StatusFailed     = "failed"
)
