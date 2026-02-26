package constants

import (
	"strings"
	"time"
)

// File upload and size limits
const (
	// MaxUploadSize is the maximum allowed file upload size (10 MB)
	MaxUploadSize = 10 << 20 // 10 MB
)

// Default server configuration
const (
	// DefaultPort is the default server port if not specified
	DefaultPort = "8080"
)

// Job status constants
const (
	StatusStarted   = "started"
	StatusCompleted = "completed"
	StatusFailed    = "failed"
)

// Allowed file types for image uploads
var (
	AllowedImageExtensions = []string{
		"jpg", "jpeg", "png",
	}
	AllowedImageMIMETypes = []string{
		"image/jpeg", "image/png",
	}
)

// MinIO storage configuration
const (
	BucketName = "animoji-images"

	// Temporary prefix
	PrefixTmp = "tmp/"

	// Published image prefixes
	PrefixImagesPublic  = "images/public/"
	PrefixImagesPrivate = "images/private/"

	// Thumbnail prefixes
	PrefixThumbnailsPublic  = "thumbnails/public/"
	PrefixThumbnailsPrivate = "thumbnails/private/"
)

// Image visibility constants
const (
	VisibilityPublic  = "public"
	VisibilityPrivate = "private"
)

// MinIO ILM configuration
const (
	TmpLifecycleRuleID = "expire-tmp-24h"
	TmpLifecycleDays   = 1
)

// PresignedURLExpiry is the lifetime of presigned URLs returned to clients.
const PresignedURLExpiry = 1 * time.Hour

// IsPrivateKey reports whether objectKey belongs to a private-visibility prefix.
func IsPrivateKey(objectKey string) bool {
	return strings.HasPrefix(objectKey, PrefixImagesPrivate) ||
		strings.HasPrefix(objectKey, PrefixThumbnailsPrivate) ||
		strings.HasPrefix(objectKey, PrefixEmojisPrivate)
}

// Image dimension limits
const (
	MaxImageWidth  = 2048
	MaxImageHeight = 2048
	MinImageWidth  = 256
	MinImageHeight = 256
)

// Thumbnail configuration
const (
	ThumbnailScaleFactor = 0.5
)

// NATS configuration
const (
	DefaultNatsURL           = "nats://nats:4222"
	NatsSubjectGenerate      = "anime.generate"
	NatsSubjectEmojiGenerate = "emoji.generate"
)

// Emoji storage prefixes
const (
	PrefixEmojisPublic  = "emojis/public/"
	PrefixEmojisPrivate = "emojis/private/"
)

// CORS configuration
const (
	CORSAllowMethods     = "GET, POST, PUT, DELETE, OPTIONS"
	CORSAllowHeaders     = "Content-Type, Authorization, Cache-Control"
	CORSExposeHeaders    = "Content-Type, Cache-Control, Connection"
	CORSAllowCredentials = "true"
)

// Authentication constants
const (
	DefaultJWTExpiryHours = 24
	StateExpiryMinutes    = 5
	CookieNameAuthToken   = "auth_token"
)

// Redis configuration
const (
	RedisDB  = 0
	RedisTTL = 24 * time.Hour // 24h matches the MinIO ILM tmp/ expiry window
)
