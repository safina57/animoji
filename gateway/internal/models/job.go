package models

// NatsJobMessage is published to NATS when a job is submitted
type NatsJobMessage struct {
	JobID              string `json:"job_id"`
	InputKey           string `json:"input_key"`
	Prompt             string `json:"prompt"`
	Width              int    `json:"width"`
	Height             int    `json:"height"`
	MIMEType           string `json:"mime_type"`
	IterationNum       int    `json:"iteration_num"`        // Version number for versioned storage
	PreviousResponseID string `json:"previous_response_id"` // OpenAI Responses API ID from prior iteration
}

// StatusEvent represents a job status event received from NATS
type StatusEvent struct {
	Status       string `json:"status"`
	ResultKey    string `json:"result_key"`
	IterationNum int    `json:"iteration_num"`
	ResponseID   string `json:"response_id"` // OpenAI Responses API ID for next iteration
}
