package jobs

// EmojiJobMessage is published once per emoji job.
// The worker generates all emotion variants from this single message.
// JSON tags must not change — Python worker reads these exact field names.
type EmojiJobMessage struct {
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
	VariantID     string `json:"variant_id,omitempty"`
	Status        string `json:"status"`
	TotalVariants int    `json:"total_variants,omitempty"`
}
