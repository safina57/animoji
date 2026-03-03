package dto

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// ParseUUIDParam extracts and validates a UUID path parameter from the request.
// Returns a descriptive error that includes the param name if the value is missing or malformed.
func ParseUUIDParam(r *http.Request, param string) (uuid.UUID, error) {
	raw := chi.URLParam(r, param)
	id, err := uuid.Parse(raw)
	if err != nil {
		return uuid.UUID{}, fmt.Errorf("invalid %s format", param)
	}
	return id, nil
}
