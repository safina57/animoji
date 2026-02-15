# Image Loading & CDN Optimization Strategy

> **Purpose**: This guide explains how to implement efficient image loading for the Animoji community feed, similar to Pinterest's approach.

## Table of Contents
1. [Current Approach vs Best Practice](#current-approach-vs-best-practice)
2. [Recommended Architecture](#recommended-architecture)
3. [Implementation Steps](#implementation-steps)
4. [Code Examples](#code-examples)
5. [Performance Optimizations](#performance-optimizations)
6. [CDN Setup](#cdn-setup)

---

## Current Approach vs Best Practice

### Current Approach (What We Have)

```
Client → Gateway API → MinIO Presigned URL (1-hour expiry) → Client downloads from MinIO
```

**Issues:**
- ❌ No CDN - slow for global users
- ❌ Presigned URLs expire after 1 hour (need regeneration)
- ❌ Full-size images only (no thumbnails)
- ❌ Every image request hits MinIO directly
- ❌ No caching

### How Pinterest Does It

Pinterest uses a multi-tier approach:

1. **CDN Layer**: Global edge caching (CloudFront, Cloudflare)
2. **Multiple Image Sizes**: Thumbnail (236x), Medium (564x), Large (2048x)
3. **Lazy Loading**: Only load images in viewport
4. **Virtual Scrolling**: Only render ~20 images in DOM at a time
5. **Progressive Loading**: Show blur-up placeholder first

---

## Recommended Architecture

### Option 1: Public Images with CDN (Best for Community Feed)

```
┌─────────┐
│ Client  │ Request feed metadata
└────┬────┘
     │ GET /api/feed
     ↓
┌──────────┐     ┌──────────────┐
│ Gateway  │────→│  PostgreSQL  │ Get image metadata
└────┬─────┘     └──────────────┘
     │
     │ Returns JSON:
     │ [{id, thumbnail_url: "https://cdn.animoji.com/public/thumb/...", ...}]
     ↓
┌─────────┐
│ Client  │ Lazy load images as user scrolls
└────┬────┘
     │ GET https://cdn.animoji.com/public/thumb/user123/image.webp
     ↓
┌───────────┐     ┌──────────┐     ┌──────────┐
│    CDN    │────→│  Nginx   │────→│  MinIO   │
│(CloudFlare)│     │(Reverse  │     │ (Public) │
│  (Cache)  │     │  Proxy)  │     │  Bucket  │
└───────────┘     └──────────┘     └──────────┘
     ↑
     │ 99% of requests served from cache
     │ (no MinIO hit)
```

**Benefits:**
- ⚡ 10-100x faster (edge cache)
- 💰 Lower bandwidth costs
- 🌍 Global distribution
- 📱 Better mobile experience

### Option 2: Private Images with Gateway Proxy

```
Client → Gateway (validates permissions) → Stream from MinIO → Client
         ↓ (HTTP Cache-Control header for browser cache)
```

---

## Implementation Steps

### Phase 1: Database Schema Update

Add thumbnail and medium size keys to the Image model:

**File**: `gateway/internal/models/image.go`

```go
type Image struct {
    // ... existing fields
    ThumbnailKey string `gorm:"size:500" json:"thumbnail_key"` // 300x300 WebP
    MediumKey    string `gorm:"size:500" json:"medium_key"`    // 800x800 WebP
    OriginalKey  string `gorm:"size:500" json:"original_key"`  // Full size
    GeneratedKey string `gorm:"size:500" json:"generated_key"` // AI result
}
```

Run GORM auto-migration to add new columns:
```bash
# Restart gateway - GORM will auto-add columns
docker-compose restart gateway
```

### Phase 2: MinIO Bucket Configuration

#### 2.1 Create Public Prefix Structure

```
animoji-images/
├── public/              # Publicly accessible
│   ├── thumbnails/      # 300x300 WebP
│   ├── medium/          # 800x800 WebP
│   └── originals/       # Full size
└── private/             # Private user images
    ├── thumbnails/
    ├── medium/
    └── originals/
```

#### 2.2 Set Public Bucket Policy

**File**: Create `gateway/scripts/setup-minio-policy.sh`

```bash
#!/bin/bash
# Set public read policy for public images

mc alias set myminio http://minio:9000 ${MINIO_ACCESS_KEY} ${MINIO_SECRET_KEY}

# Create policy file
cat > /tmp/public-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": ["*"]},
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::animoji-images/public/*"]
    }
  ]
}
EOF

# Apply policy
mc anonymous set-json /tmp/public-policy.json myminio/animoji-images/public
echo "Public policy applied successfully"
```

Run during docker-compose startup or manually.

### Phase 3: Image Processing Service

#### 3.1 Install Image Processing Library

```bash
cd gateway
go get github.com/disintegration/imaging
```

#### 3.2 Create Image Processor

**File**: `gateway/pkg/imageprocessor/processor.go`

```go
package imageprocessor

import (
    "bytes"
    "fmt"
    "image"
    "io"

    "github.com/chai2010/webp"
    "github.com/disintegration/imaging"
)

type Processor struct{}

func NewProcessor() *Processor {
    return &Processor{}
}

// ResizeToThumbnail creates a 300x300 thumbnail
func (p *Processor) ResizeToThumbnail(reader io.Reader) ([]byte, error) {
    img, _, err := image.Decode(reader)
    if err != nil {
        return nil, fmt.Errorf("failed to decode image: %w", err)
    }

    // Resize to 300x300, maintaining aspect ratio
    thumbnail := imaging.Fill(img, 300, 300, imaging.Center, imaging.Lanczos)

    // Encode as WebP
    var buf bytes.Buffer
    if err := webp.Encode(&buf, thumbnail, &webp.Options{Quality: 80}); err != nil {
        return nil, fmt.Errorf("failed to encode webp: %w", err)
    }

    return buf.Bytes(), nil
}

// ResizeToMedium creates an 800x800 medium size
func (p *Processor) ResizeToMedium(reader io.Reader) ([]byte, error) {
    img, _, err := image.Decode(reader)
    if err != nil {
        return nil, fmt.Errorf("failed to decode image: %w", err)
    }

    // Resize to 800x800
    medium := imaging.Fill(img, 800, 800, imaging.Center, imaging.Lanczos)

    var buf bytes.Buffer
    if err := webp.Encode(&buf, medium, &webp.Options{Quality: 85}); err != nil {
        return nil, fmt.Errorf("failed to encode webp: %w", err)
    }

    return buf.Bytes(), nil
}

// OptimizeOriginal converts to WebP without resizing
func (p *Processor) OptimizeOriginal(reader io.Reader) ([]byte, error) {
    img, _, err := image.Decode(reader)
    if err != nil {
        return nil, fmt.Errorf("failed to decode image: %w", err)
    }

    var buf bytes.Buffer
    if err := webp.Encode(&buf, img, &webp.Options{Quality: 90}); err != nil {
        return nil, fmt.Errorf("failed to encode webp: %w", err)
    }

    return buf.Bytes(), nil
}
```

#### 3.3 Update Submit Job Handler

**File**: `gateway/internal/handlers/submit_job.go`

Add after uploading original image:

```go
import "yourmodule/pkg/imageprocessor"

func (h *Handler) Handle(w http.ResponseWriter, r *http.Request) {
    // ... existing upload code ...

    // Upload original
    originalKey := fmt.Sprintf("public/originals/%s/%s", userID, filename)
    h.storage.Upload(ctx, originalKey, imageFile)

    // Generate thumbnail
    imageFile.Seek(0, 0) // Reset reader
    processor := imageprocessor.NewProcessor()
    thumbnailBytes, err := processor.ResizeToThumbnail(imageFile)
    if err != nil {
        log.Error().Err(err).Msg("Failed to generate thumbnail")
    } else {
        thumbnailKey := fmt.Sprintf("public/thumbnails/%s/%s.webp", userID, jobID)
        h.storage.UploadBytes(ctx, thumbnailKey, thumbnailBytes)
    }

    // Generate medium size
    imageFile.Seek(0, 0)
    mediumBytes, err := processor.ResizeToMedium(imageFile)
    if err != nil {
        log.Error().Err(err).Msg("Failed to generate medium size")
    } else {
        mediumKey := fmt.Sprintf("public/medium/%s/%s.webp", userID, jobID)
        h.storage.UploadBytes(ctx, mediumKey, mediumBytes)
    }

    // Store all keys in database
    image := &models.Image{
        UserID:       userID,
        JobID:        jobID,
        OriginalKey:  originalKey,
        ThumbnailKey: thumbnailKey,
        MediumKey:    mediumKey,
        Visibility:   models.VisibilityPublic,
    }
    h.repo.CreateImage(ctx, image)
}
```

### Phase 4: Update Feed API

**File**: `gateway/internal/handlers/feed.go`

```go
package handlers

import (
    "encoding/json"
    "net/http"
    "os"
)

type FeedImage struct {
    ID           string   `json:"id"`
    ThumbnailURL string   `json:"thumbnail_url"`
    MediumURL    string   `json:"medium_url"`
    FullURL      string   `json:"full_url"`
    Prompts      []string `json:"prompts"`
    LikesCount   int      `json:"likes_count"`
    CreatorName  string   `json:"creator_name"`
}

func (h *Handler) GetFeed(w http.ResponseWriter, r *http.Request) {
    // Get pagination params
    limit := 20
    offset := 0 // from query params

    // Fetch images from database
    images, err := h.repo.GetPublicImages(r.Context(), limit, offset)
    if err != nil {
        http.Error(w, "failed to fetch feed", 500)
        return
    }

    // Build response with CDN URLs
    cdnBaseURL := os.Getenv("CDN_BASE_URL") // e.g., https://cdn.animoji.com
    response := make([]FeedImage, len(images))

    for i, img := range images {
        response[i] = FeedImage{
            ID:           img.ID.String(),
            ThumbnailURL: fmt.Sprintf("%s/%s", cdnBaseURL, img.ThumbnailKey),
            MediumURL:    fmt.Sprintf("%s/%s", cdnBaseURL, img.MediumKey),
            FullURL:      fmt.Sprintf("%s/%s", cdnBaseURL, img.OriginalKey),
            Prompts:      img.Prompts,
            LikesCount:   img.LikesCount,
            CreatorName:  img.User.Name,
        }
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}
```

### Phase 5: Frontend Lazy Loading

**File**: `frontend/src/pages/CommunityPage.tsx`

```tsx
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';

interface FeedImage {
  id: string;
  thumbnail_url: string;
  medium_url: string;
  full_url: string;
  prompts: string[];
  likes_count: number;
  creator_name: string;
}

function ImageCard({ image }: { image: FeedImage }) {
  const { ref, inView } = useInView({
    triggerOnce: true, // Only load once
    threshold: 0.1,    // Load when 10% visible
  });

  return (
    <div ref={ref} className="image-card">
      {inView ? (
        <img
          src={image.thumbnail_url}
          alt={image.prompts[0]}
          loading="lazy"
          className="w-full h-auto rounded-lg"
        />
      ) : (
        <div className="placeholder bg-gray-200 aspect-square rounded-lg animate-pulse" />
      )}
      <div className="info">
        <p>{image.prompts[0]}</p>
        <span>❤️ {image.likes_count}</span>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const [images, setImages] = useState<FeedImage[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    const response = await fetch(`/api/feed?limit=20&offset=${page * 20}`);
    const newImages = await response.json();

    if (newImages.length < 20) setHasMore(false);
    setImages([...images, ...newImages]);
    setPage(page + 1);
  };

  // Infinite scroll detector
  const { ref: loadMoreRef, inView: loadMoreInView } = useInView();

  useEffect(() => {
    if (loadMoreInView && hasMore) {
      loadMore();
    }
  }, [loadMoreInView]);

  return (
    <div className="masonry-grid">
      {images.map((image) => (
        <ImageCard key={image.id} image={image} />
      ))}
      {hasMore && <div ref={loadMoreRef} className="loading-trigger" />}
    </div>
  );
}
```

**Install dependencies:**
```bash
cd frontend
pnpm add react-intersection-observer
```

---

## CDN Setup

### Option 1: Cloudflare (Recommended - Free Tier)

#### 1.1 Add Domain to Cloudflare
- Go to https://cloudflare.com
- Add your domain (e.g., `animoji.com`)
- Update nameservers at your domain registrar

#### 1.2 Create Subdomain
- Create CNAME record: `cdn.animoji.com` → `your-server-ip`
- Enable Cloudflare proxy (orange cloud icon)

#### 1.3 Configure Caching Rules
In Cloudflare dashboard:
- **Cache Level**: Standard
- **Browser Cache TTL**: 4 hours
- **Edge Cache TTL**: 1 month
- **Cache Everything** rule for `/public/*`

#### 1.4 Update Nginx Configuration

**File**: `nginx/default.conf`

```nginx
server {
    listen 80;
    server_name cdn.animoji.com;

    # Cache headers for public images
    location /public/ {
        proxy_pass http://minio:9000/animoji-images/public/;

        # Cache control headers
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Content-Type-Options "nosniff";

        # CORS headers for cross-origin requests
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, OPTIONS";

        # Proxy settings
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;
    }

    # Health check endpoint
    location /health {
        return 200 "OK";
    }
}
```

#### 1.5 Update Environment Variables

**File**: `.env`

```env
# CDN Configuration
CDN_BASE_URL=https://cdn.animoji.com
MINIO_PUBLIC_URL=https://cdn.animoji.com/public
```

### Option 2: AWS CloudFront (Production Grade)

1. **Create CloudFront Distribution**
   - Origin: Your MinIO endpoint
   - Cache behavior: Cache based on query strings
   - Compress objects automatically: Yes
   - Price class: Use all edge locations

2. **Update DNS**
   - CNAME: `cdn.animoji.com` → `d111111abcdef8.cloudfront.net`

3. **Invalidation** (when images change)
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id E1234EXAMPLE \
     --paths "/public/thumbnails/*"
   ```

---

## Performance Optimizations

### 1. Image Format Selection

Use WebP format (90% smaller than JPEG):
```go
// Gateway automatically converts to WebP
webp.Encode(&buf, img, &webp.Options{Quality: 85})
```

### 2. Progressive Loading (Blur-up Technique)

**Generate tiny blur placeholder** (10x10px, base64-encoded):

```go
func (p *Processor) GenerateBlurPlaceholder(reader io.Reader) (string, error) {
    img, _, _ := image.Decode(reader)
    tiny := imaging.Resize(img, 10, 10, imaging.Lanczos)

    var buf bytes.Buffer
    jpeg.Encode(&buf, tiny, &jpeg.Options{Quality: 50})

    base64Str := base64.StdEncoding.EncodeToString(buf.Bytes())
    return fmt.Sprintf("data:image/jpeg;base64,%s", base64Str), nil
}
```

Store in database:
```go
type Image struct {
    // ...
    BlurPlaceholder string `gorm:"type:text" json:"blur_placeholder"`
}
```

Frontend uses:
```tsx
<img
  src={image.thumbnail_url}
  placeholder={image.blur_placeholder}
  className="blur-up"
/>
```

### 3. Virtual Scrolling (For 1000+ Images)

Use `react-window` for rendering only visible items:

```bash
pnpm add react-window
```

```tsx
import { FixedSizeGrid } from 'react-window';

function VirtualizedGrid({ images }) {
  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * 3 + columnIndex;
    const image = images[index];

    return (
      <div style={style}>
        <ImageCard image={image} />
      </div>
    );
  };

  return (
    <FixedSizeGrid
      columnCount={3}
      rowCount={Math.ceil(images.length / 3)}
      columnWidth={300}
      rowHeight={400}
      height={window.innerHeight}
      width={window.innerWidth}
    >
      {Cell}
    </FixedSizeGrid>
  );
}
```

### 4. Prefetching Next Page

```tsx
useEffect(() => {
  // Prefetch next page when user is 80% through current page
  if (scrollPercent > 0.8 && !loading) {
    loadMore();
  }
}, [scrollPercent]);
```

---

## Performance Comparison

| Metric | Before (Direct MinIO) | After (CDN + Thumbnails) |
|--------|----------------------|--------------------------|
| **Initial Load** | 5-10s (20 full images) | 0.5-1s (20 thumbnails) |
| **Bandwidth/Image** | ~2 MB (full size) | ~30 KB (thumbnail) |
| **Global Latency** | 500-2000ms | 20-100ms (edge cache) |
| **Monthly Bandwidth** | ~200 GB | ~3 GB (98% reduction) |
| **Cache Hit Rate** | 0% (no cache) | 95%+ (CDN cache) |

---

## Implementation Checklist

### Backend (Gateway)
- [ ] Update Image model with `thumbnail_key`, `medium_key`
- [ ] Install image processing library (`disintegration/imaging`)
- [ ] Create image processor service
- [ ] Update submit_job handler to generate thumbnails
- [ ] Set MinIO public bucket policy
- [ ] Add CDN_BASE_URL environment variable
- [ ] Update feed API to return CDN URLs

### Frontend
- [ ] Install `react-intersection-observer`
- [ ] Implement lazy loading in ImageCard component
- [ ] Add infinite scroll with IntersectionObserver
- [ ] Update feed API client to fetch from new endpoint
- [ ] Add loading placeholders (skeleton screens)

### Infrastructure
- [ ] Configure Nginx reverse proxy for MinIO
- [ ] Set up Cloudflare CDN (or CloudFront)
- [ ] Configure cache headers (1 month for images)
- [ ] Add CDN subdomain (cdn.animoji.com)
- [ ] Test cache hit rates

### Testing
- [ ] Test thumbnail generation on upload
- [ ] Verify CDN cache headers
- [ ] Test lazy loading scrolling
- [ ] Measure page load performance (Lighthouse)
- [ ] Test on mobile devices

---

## Troubleshooting

### Images not loading from CDN
- Check Nginx proxy configuration
- Verify MinIO bucket is publicly accessible
- Check Cloudflare DNS settings (orange cloud enabled)

### Thumbnails not generating
- Check image processor logs
- Verify ImageMagick/WebP libraries installed
- Test resize function with sample image

### Slow loading despite CDN
- Check cache hit rate in Cloudflare analytics
- Verify cache headers are set correctly
- Consider image compression settings

---

## Future Enhancements

1. **Adaptive Image Loading**
   - Detect user's network speed (4G, 5G, WiFi)
   - Load lower quality on slow connections

2. **Smart Cropping**
   - Use ML to detect focal points (faces, objects)
   - Crop thumbnails intelligently

3. **Image Optimization Service**
   - Background worker processes images
   - Generates multiple formats (WebP, AVIF, JPEG)
   - Serves best format based on browser support

4. **Analytics**
   - Track image load times
   - Monitor CDN cache hit rates
   - Identify slow images

---

## References

- [Pinterest Engineering Blog - Image Optimization](https://medium.com/pinterest-engineering)
- [Cloudflare CDN Documentation](https://developers.cloudflare.com/cache/)
- [WebP Image Format](https://developers.google.com/speed/webp)
- [React Intersection Observer](https://github.com/thebuilder/react-intersection-observer)
- [Lazy Loading Best Practices](https://web.dev/lazy-loading-images/)

---

**Next Steps**: When ready to implement the community feed, follow this guide step-by-step. Start with Phase 1 (database schema) and work through each phase sequentially.
