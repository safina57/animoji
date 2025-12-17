package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/safina57/animoji/gateway/pkg/imageinfo"
)

func main() {
	// Check command line arguments
	if len(os.Args) < 2 {
		fmt.Println("Usage: imginfo <image_path>")
		os.Exit(1)
	}

	imagePath := os.Args[1]

	// Create service with default config
	service := imageinfo.NewService(imageinfo.DefaultConfig())

	// Process image (validate + extract metadata)
	info, err := service.Process(imagePath)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}

	// Output as JSON
	output, err := json.MarshalIndent(info, "", "  ")
	if err != nil {
		fmt.Printf("Error marshaling JSON: %v\n", err)
		os.Exit(1)
	}

	fmt.Println(string(output))
}
