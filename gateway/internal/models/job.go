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
	JobID   string `json:"job_id"`
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

// NatsJobMessage is published to NATS when a job is submitted.
type NatsJobMessage struct {
	JobID    string `json:"job_id"`
	InputKey string `json:"input_key"`
	Prompt   string `json:"prompt"`
}

// StatusEvent represents a job status event received from NATS
type StatusEvent struct {
	Status    string `json:"status"`
	ResultKey string `json:"result_key"`
}

// JobStatusResponse is returned by the job status endpoint
type JobStatusResponse struct {
	JobID       string `json:"job_id"`
	Status      string `json:"status"`
	OriginalURL string `json:"original_url,omitempty"`
	ResultURL   string `json:"result_url,omitempty"`
}
