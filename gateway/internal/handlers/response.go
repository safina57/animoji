package handlers

import (
	"encoding/json"
	"net/http"
)

// respondJSON sends a JSON response
func respondJSON(w http.ResponseWriter, data any, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// respondError sends a JSON error response
func respondError(w http.ResponseWriter, message string, statusCode int) {
	respondJSON(w, map[string]string{
		"error": message,
	}, statusCode)
}
