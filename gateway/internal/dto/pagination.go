package dto

import (
	"net/http"
	"strconv"
)

// PaginationParams represents validated pagination parameters
type PaginationParams struct {
	Limit  int `validate:"required,min=1,max=50"`
	Offset int `validate:"omitempty,min=0"`
}

// ParsePaginationParams parses limit and offset from query params with safe defaults.
func ParsePaginationParams(r *http.Request, defaultLimit int) PaginationParams {
	limit := defaultLimit
	offset := 0

	if v := r.URL.Query().Get("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			if n < 1 {
				n = 1
			} else if n > 50 {
				n = 50
			}
			limit = n
		}
	}
	if v := r.URL.Query().Get("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 {
			offset = n
		}
	}

	return PaginationParams{Limit: limit, Offset: offset}
}
