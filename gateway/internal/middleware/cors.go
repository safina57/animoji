package middleware

import (
	"net/http"

	"github.com/safina57/animoji/gateway/internal/constants"
)

// CORS adds Cross-Origin Resource Sharing headers for frontend integration
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", constants.CORSAllowOrigin)
		w.Header().Set("Access-Control-Allow-Methods", constants.CORSAllowMethods)
		w.Header().Set("Access-Control-Allow-Headers", constants.CORSAllowHeaders)
		w.Header().Set("Access-Control-Expose-Headers", constants.CORSExposeHeaders)

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
