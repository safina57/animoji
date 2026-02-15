package middleware

import (
	"net/http"
	"os"

	"github.com/safina57/animoji/gateway/internal/constants"
)

// CORS adds Cross-Origin Resource Sharing headers for frontend integration
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := os.Getenv("FRONTEND_URL")
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", constants.CORSAllowMethods)
		w.Header().Set("Access-Control-Allow-Headers", constants.CORSAllowHeaders)
		w.Header().Set("Access-Control-Expose-Headers", constants.CORSExposeHeaders)
		w.Header().Set("Access-Control-Allow-Credentials", constants.CORSAllowCredentials)

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
