package constants

// ImagePrefix returns the published images MinIO prefix for the given visibility
func ImagePrefix(visibility string) string {
	if visibility == VisibilityPublic {
		return PrefixImagesPublic
	}
	return PrefixImagesPrivate
}

// ThumbnailPrefix returns the thumbnails MinIO prefix for the given visibility
func ThumbnailPrefix(visibility string) string {
	if visibility == VisibilityPublic {
		return PrefixThumbnailsPublic
	}
	return PrefixThumbnailsPrivate
}

// EmojiPrefix returns the published emojis MinIO prefix for the given visibility
func EmojiPrefix(visibility string) string {
	if visibility == VisibilityPublic {
		return PrefixEmojisPublic
	}
	return PrefixEmojisPrivate
}
