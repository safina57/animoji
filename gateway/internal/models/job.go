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

// EmojiNatsJobMessage is published once per emoji job.
// The worker generates all emotion variants from this single message.
type EmojiNatsJobMessage struct {
	JobID    string `json:"job_id"`
	InputKey string `json:"input_key"`
	Prompt   string `json:"prompt"`
	MIMEType string `json:"mime_type"`
}

// EmojiStatusEvent represents an emoji variant status event received from NATS.
// When Status == "started", TotalVariants is set and Emotion/ResultKey are empty.
type EmojiStatusEvent struct {
	Status        string `json:"status"`
	Emotion       string `json:"emotion"`
	VariantIndex  int    `json:"variant_index"`
	ResultKey     string `json:"result_key"`
	TotalVariants int    `json:"total_variants,omitempty"`
}

// EmojiPartialEvent carries a single emoji status event from worker → SSE handler.
// When Status == "started", TotalVariants is set and Emotion/ResultKey are empty.
type EmojiPartialEvent struct {
	Emotion       string `json:"emotion"`
	VariantIndex  int    `json:"variant_index"`
	ResultKey     string `json:"result_key"`
	VariantID     string `json:"variant_id,omitempty"` // set only on "completed" events
	Status        string `json:"status"`               // "started", "completed", or "failed"
	TotalVariants int    `json:"total_variants,omitempty"`
}
