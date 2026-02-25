package jobs

// ImageJobMessage is published to NATS when an image job is submitted.
// JSON tags must not change — Python worker reads these exact field names.
type ImageJobMessage struct {
	JobID              string `json:"job_id"`
	InputKey           string `json:"input_key"`
	Prompt             string `json:"prompt"`
	Width              int    `json:"width"`
	Height             int    `json:"height"`
	MIMEType           string `json:"mime_type"`
	IterationNum       int    `json:"iteration_num"`
	PreviousResponseID string `json:"previous_response_id"`
}

// ImageStatusEvent represents a job status event received from NATS.
type ImageStatusEvent struct {
	Status       string `json:"status"`
	ResultKey    string `json:"result_key"`
	IterationNum int    `json:"iteration_num"`
	ResponseID   string `json:"response_id"`
}
