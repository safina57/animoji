package handlers

import (
	"encoding/json"
	"net/http"
)

// RespondJSON sends a JSON response
func RespondJSON(w http.ResponseWriter, data any, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(data)
}

// RespondError sends a JSON error response
func RespondError(w http.ResponseWriter, message string, statusCode int) {
	RespondJSON(w, map[string]string{
		"error": message,
	}, statusCode)
}
