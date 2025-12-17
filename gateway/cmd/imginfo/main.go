package main

import (
    "encoding/json"
    "fmt"
    "os"
    "path/filepath"
)

// ImageInfo holds metadata about an image file
type ImageInfo struct {
    Filename     string `json:"filename"`
    SizeBytes    int64  `json:"size_bytes"`
    Extension    string `json:"extension"`
    ReadableSize string `json:"readable_size"`
}

func main() {
    // Check command line arguments
    if len(os.Args) < 2 {
        fmt.Println("Usage: imginfo <image_path>")
        os.Exit(1)
    }

    imagePath := os.Args[1]

    // Get file info
    info, err := getImageInfo(imagePath)
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

func getImageInfo(path string) (*ImageInfo, error) {
    // Stat the file
    stat, err := os.Stat(path)
    if err != nil {
        return nil, fmt.Errorf("cannot read file: %w", err)
    }

    if stat.IsDir() {
        return nil, fmt.Errorf("path is a directory, not a file")
    }

    return &ImageInfo{
        Filename:     stat.Name(),
        SizeBytes:    stat.Size(),
        Extension:    filepath.Ext(path)[1:], // Remove leading dot
        ReadableSize: formatBytes(stat.Size()),
    }, nil
}

func formatBytes(bytes int64) string {
    const unit = 1024
    if bytes < unit {
        return fmt.Sprintf("%d B", bytes)
    }
    div, exp := int64(unit), 0
    for n := bytes / unit; n >= unit; n /= unit {
        div *= unit
        exp++
    }
    return fmt.Sprintf("%.2f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}