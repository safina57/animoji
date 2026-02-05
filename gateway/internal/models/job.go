package models

import (
	"time"
)

// GenerateRequest represents the request payload for image generation
type GenerateRequest struct {
	Prompt string `json:"prompt"`
}

// SubmitJobResponse is returned when a job is successfully submitted to the queue
type SubmitJobResponse struct {
	JobID    string `json:"job_id"`
	Status   string `json:"status"`
	Message  string `json:"message"`
	InputKey string `json:"input_key"`
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
