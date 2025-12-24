package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/safina57/animoji/gateway/internal/handlers"
	appMiddleware "github.com/safina57/animoji/gateway/internal/middleware"
)

func main() {
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)

	// CORS middleware for frontend integration
	r.Use(appMiddleware.CORS)

	// Routes
	r.Get("/health", handlers.HandleHealth)
	r.Post("/generate", handlers.HandleGenerate)

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start server
	addr := fmt.Sprintf(":%s", port)
	fmt.Println(`                                                 
                                                 
                                                 
   ██   ██   █ █████  █▒  ▒█  ▓██▓    ███  █████ 
   ██   ██░  █   █    ██  ██ ▒█  █▒     █    █   
  ▒██▒  █▒▓  █   █    ██░░██ █░  ░█     █    █   
  ▓▒▒▓  █ █  █   █    █▒▓▓▒█ █    █     █    █   
  █░░█  █ ▓▓ █   █    █ ██ █ █    █     █    █   
  █  █  █  █ █   █    █ █▓ █ █    █     █    █   
 ▒████▒ █  ▓▒█   █    █    █ █░  ░█     █    █   
 ▓▒  ▒▓ █  ░██   █    █    █ ▒█  █▒ █░ ▒█    █   
 █░  ░█ █   ██ █████  █    █  ▓██▓  ▒███░  █████ 
                                                 
                                                 
    `)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatal(err)
	}
}
