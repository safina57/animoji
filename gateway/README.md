# Gateway Service

API Gateway service for the Animoji project. This service handles HTTP requests for image processing and job management.

## Building

### Build the binary

```bash
go build -o bin/gateway ./cmd/api
```

## Running

### Run directly with Go

```bash
go run ./cmd/api/main.go
```

### Run the compiled binary

```bash
./bin/gateway
```

## Configuration

The service can be configured using environment variables:

- `PORT` - Server port (default: 8080)

## API Endpoints

### Health Check
```
GET /health
```
Returns the health status of the service.

### Generate Image
```
POST /generate
```
Accepts image data and creates a processing job.

