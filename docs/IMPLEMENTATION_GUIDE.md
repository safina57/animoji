# Animoji Social Platform - Implementation Guide

> **Purpose**: This guide serves as a roadmap for implementing social features in Animoji across multiple development sessions. Each phase can be implemented independently.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Phase 1: Authentication](#phase-1-authentication)
4. [Phase 2: Save & Share](#phase-2-save--share)
5. [Phase 3: Community Feed](#phase-3-community-feed)
6. [Phase 4: Gallery & Collections](#phase-4-gallery--collections)
7. [API Reference](#api-reference)
8. [Collaborative Filtering Algorithm](#collaborative-filtering-algorithm)
9. [Environment Setup](#environment-setup)
10. [📸 Image Loading & CDN Strategy](./IMAGE_LOADING_STRATEGY.md) - **Important for Community Feed**

---

## Architecture Overview

### Current State
```
User (no auth) → Upload Image → Gateway → MinIO → NATS → AI Worker → Result
```

### Target State
```
User (Google OAuth) → Upload Image → Gateway → PostgreSQL + MinIO → NATS → AI Worker
                                         ↓
                              Store metadata (likes, visibility, creator)
                                         ↓
                         Community Feed (collaborative filtering recommendations)
                                         ↓
                           Gallery (collections, share links)
```

### Technology Stack

**Frontend:**
- React 19 + TypeScript
- Redux Toolkit (state management)
- TailwindCSS 4 (styling)
- JWT decode (token parsing)
- React Intersection Observer (infinite scroll)

**Backend:**
- Go 1.21+ with chi router
- PostgreSQL 16 (relational database)
- GORM v1.25+ (ORM with auto-migrations)
- PostgreSQL driver for GORM (gorm.io/driver/postgres)
- golang-jwt v5 (JWT tokens)
- Google OAuth2 (authentication)

**Infrastructure:**
- Docker Compose (orchestration)
- MinIO (object storage)
- NATS (message broker)

---

## Database Schema

### Tables

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Images (generated results)
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id VARCHAR(255) UNIQUE NOT NULL,
    prompts TEXT[] NOT NULL,
    enhanced_prompt TEXT,
    original_key VARCHAR(500) NOT NULL,
    generated_key VARCHAR(500) NOT NULL,
    visibility VARCHAR(20) NOT NULL DEFAULT 'private',
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Likes
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, image_id)
);

-- Collections (user galleries)
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Collection items (many-to-many)
CREATE TABLE collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    added_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(collection_id, image_id)
);

-- Share links (expiring)
CREATE TABLE share_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(64) UNIQUE NOT NULL,
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User similarity (for recommendations)
CREATE MATERIALIZED VIEW user_similarity AS
SELECT
    l1.user_id as user1_id,
    l2.user_id as user2_id,
    COUNT(*) as common_likes
FROM likes l1
JOIN likes l2 ON l1.image_id = l2.image_id AND l1.user_id < l2.user_id
GROUP BY l1.user_id, l2.user_id;

CREATE UNIQUE INDEX idx_user_similarity ON user_similarity(user1_id, user2_id);
```

### Indexes
```sql
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_visibility ON images(visibility);
CREATE INDEX idx_images_created_at ON images(created_at DESC);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_image_id ON likes(image_id);
CREATE INDEX idx_collection_items_collection ON collection_items(collection_id);
CREATE INDEX idx_share_links_token ON share_links(token);
CREATE INDEX idx_share_links_expires ON share_links(expires_at);
```

---

## Phase 1: Authentication

### Goal
Add Google OAuth authentication with JWT token-based authorization.

### Backend Tasks

#### 1. Add PostgreSQL to Docker Compose

**File:** `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: animoji-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: animoji
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - animoji-network
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  gateway:
    depends_on:
      postgres:
        condition: service_healthy
      # ... existing dependencies

volumes:
  postgres-data:
```

#### 2. Install Go Dependencies

```bash
cd gateway
go get gorm.io/gorm
go get gorm.io/driver/postgres
go get github.com/golang-jwt/jwt/v5
go get golang.org/x/oauth2
go get golang.org/x/oauth2/google
```

#### 3. Create User Model

**File:** `gateway/internal/models/user.go`

```go
package models

import (
    "time"

    "github.com/google/uuid"
    "gorm.io/gorm"
)

type User struct {
    ID        uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    GoogleID  string         `gorm:"uniqueIndex;not null" json:"google_id"`
    Email     string         `gorm:"uniqueIndex;not null" json:"email"`
    Name      string         `gorm:"not null" json:"name"`
    AvatarURL *string        `gorm:"type:text" json:"avatar_url,omitempty"`
    CreatedAt time.Time      `gorm:"not null;default:now()" json:"created_at"`
    UpdatedAt time.Time      `gorm:"not null;default:now()" json:"updated_at"`
    DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (User) TableName() string {
    return "users"
}
```

#### 4. Create Database Package

**File:** `gateway/pkg/database/client.go`

```go
package database

import (
    "database/sql"
    "fmt"
    "os"
    "sync"
    "time"

    "github.com/rs/zerolog/log"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

var (
    dbInstance *gorm.DB
    dbOnce     sync.Once
)

// Init initializes the database connection and runs auto-migrations
func Init(models ...interface{}) (*gorm.DB, error) {
    var err error

    dbOnce.Do(func() {
        databaseURL := os.Getenv("DATABASE_URL")
        if databaseURL == "" {
            err = fmt.Errorf("DATABASE_URL environment variable is not set")
            return
        }

        // Configure GORM logger
        gormLogger := logger.New(
            log.Logger,
            logger.Config{
                SlowThreshold:             200 * time.Millisecond,
                LogLevel:                  logger.Warn,
                IgnoreRecordNotFoundError: true,
                Colorful:                  false,
            },
        )

        // Connect to database
        config := &gorm.Config{
            Logger:                 gormLogger,
            SkipDefaultTransaction: true,
            PrepareStmt:            true,
        }

        dbInstance, err = gorm.Open(postgres.Open(databaseURL), config)
        if err != nil {
            err = fmt.Errorf("failed to connect to database: %w", err)
            return
        }

        // Run auto-migrations
        if err = dbInstance.AutoMigrate(models...); err != nil {
            err = fmt.Errorf("failed to run auto-migrations: %w", err)
            return
        }

        // Configure connection pool
        sqlDB, sqlErr := dbInstance.DB()
        if sqlErr != nil {
            err = fmt.Errorf("failed to get underlying SQL DB: %w", sqlErr)
            return
        }

        sqlDB.SetMaxOpenConns(25)
        sqlDB.SetMaxIdleConns(5)
        sqlDB.SetConnMaxLifetime(5 * time.Minute)

        log.Info().Msg("Database connection initialized with auto-migrations")
    })

    return dbInstance, err
}

func GetDB() *gorm.DB {
    return dbInstance
}
```

#### 5. Create Auth Package

**File:** `gateway/internal/auth/jwt.go`

```go
package auth

import (
    "crypto/rsa"
    "fmt"
    "time"

    "github.com/golang-jwt/jwt/v5"
    "github.com/google/uuid"
)

type JWTClaims struct {
    UserID uuid.UUID `json:"user_id"`
    Email  string    `json:"email"`
    Name   string    `json:"name"`
    jwt.RegisteredClaims
}

func GenerateJWT(userID uuid.UUID, email, name string, privateKey *rsa.PrivateKey, expiryHours int) (string, error) {
    claims := JWTClaims{
        UserID: userID,
        Email:  email,
        Name:   name,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * time.Duration(expiryHours))),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            Issuer:    "animoji-gateway",
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
    return token.SignedString(privateKey)
}

func ValidateJWT(tokenString string, publicKey *rsa.PublicKey) (*JWTClaims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
        }
        return publicKey, nil
    })

    if err != nil {
        return nil, err
    }

    if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
        return claims, nil
    }

    return nil, fmt.Errorf("invalid token")
}
```

**File:** `gateway/internal/auth/google.go`

```go
package auth

import (
    "context"
    "encoding/json"
    "fmt"
    "io"

    "golang.org/x/oauth2"
    "golang.org/x/oauth2/google"
)

type GoogleOAuthClient struct {
    config *oauth2.Config
}

type GoogleUserInfo struct {
    ID      string `json:"id"`
    Email   string `json:"email"`
    Name    string `json:"name"`
    Picture string `json:"picture"`
}

func NewGoogleOAuthClient(clientID, clientSecret, redirectURL string) *GoogleOAuthClient {
    return &GoogleOAuthClient{
        config: &oauth2.Config{
            ClientID:     clientID,
            ClientSecret: clientSecret,
            RedirectURL:  redirectURL,
            Scopes: []string{
                "https://www.googleapis.com/auth/userinfo.email",
                "https://www.googleapis.com/auth/userinfo.profile",
            },
            Endpoint: google.Endpoint,
        },
    }
}

func (c *GoogleOAuthClient) GetAuthURL(state string) string {
    return c.config.AuthCodeURL(state, oauth2.AccessTypeOffline)
}

func (c *GoogleOAuthClient) ExchangeCode(ctx context.Context, code string) (*oauth2.Token, error) {
    return c.config.Exchange(ctx, code)
}

func (c *GoogleOAuthClient) GetUserInfo(ctx context.Context, token *oauth2.Token) (*GoogleUserInfo, error) {
    client := c.config.Client(ctx, token)
    resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    var userInfo GoogleUserInfo
    if err := json.Unmarshal(body, &userInfo); err != nil {
        return nil, err
    }

    return &userInfo, nil
}
```

**File:** `gateway/internal/auth/middleware.go`

```go
package auth

import (
    "context"
    "crypto/rsa"
    "net/http"
    "strings"

    "github.com/google/uuid"
    "github.com/rs/zerolog/log"
)

type contextKey string

const UserContextKey contextKey = "user"

type AuthMiddleware struct {
    publicKey *rsa.PublicKey
}

func NewAuthMiddleware(publicKey *rsa.PublicKey) *AuthMiddleware {
    return &AuthMiddleware{publicKey: publicKey}
}

func (m *AuthMiddleware) Authenticate(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        authHeader := r.Header.Get("Authorization")
        if authHeader == "" {
            http.Error(w, "missing authorization header", http.StatusUnauthorized)
            return
        }

        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            http.Error(w, "invalid authorization header format", http.StatusUnauthorized)
            return
        }

        tokenString := parts[1]
        claims, err := ValidateJWT(tokenString, m.publicKey)
        if err != nil {
            log.Error().Err(err).Msg("JWT validation failed")
            http.Error(w, "invalid token", http.StatusUnauthorized)
            return
        }

        ctx := context.WithValue(r.Context(), UserContextKey, claims)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

func GetUserFromContext(ctx context.Context) (*JWTClaims, error) {
    claims, ok := ctx.Value(UserContextKey).(*JWTClaims)
    if !ok {
        return nil, fmt.Errorf("user not found in context")
    }
    return claims, nil
}
```

#### 6. Create User Repository

**File:** `gateway/internal/repository/repository.go`

```go
package repository

import "github.com/jackc/pgx/v5/pgxpool"

type Repository struct {
    db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
    return &Repository{db: db}
}
```

**File:** `gateway/internal/repository/users.go`

```go
package repository

import (
    "context"
    "fmt"

    "github.com/google/uuid"
    "yourmodule/internal/models"
)

func (r *Repository) CreateOrUpdateUser(ctx context.Context, googleID, email, name, avatarURL string) (*models.User, error) {
    query := `
        INSERT INTO users (google_id, email, name, avatar_url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (google_id)
        DO UPDATE SET
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            avatar_url = EXCLUDED.avatar_url,
            updated_at = NOW()
        RETURNING id, google_id, email, name, avatar_url, created_at, updated_at
    `

    var user models.User
    err := r.db.QueryRow(ctx, query, googleID, email, name, avatarURL).Scan(
        &user.ID,
        &user.GoogleID,
        &user.Email,
        &user.Name,
        &user.AvatarURL,
        &user.CreatedAt,
        &user.UpdatedAt,
    )
    if err != nil {
        return nil, fmt.Errorf("failed to create/update user: %w", err)
    }

    return &user, nil
}

func (r *Repository) GetUserByID(ctx context.Context, userID uuid.UUID) (*models.User, error) {
    query := `
        SELECT id, google_id, email, name, avatar_url, created_at, updated_at
        FROM users
        WHERE id = $1
    `

    var user models.User
    err := r.db.QueryRow(ctx, query, userID).Scan(
        &user.ID,
        &user.GoogleID,
        &user.Email,
        &user.Name,
        &user.AvatarURL,
        &user.CreatedAt,
        &user.UpdatedAt,
    )
    if err != nil {
        return nil, fmt.Errorf("failed to get user: %w", err)
    }

    return &user, nil
}
```

#### 7. Create Auth Models

**File:** `gateway/internal/models/user.go`

```go
package models

import (
    "time"

    "github.com/google/uuid"
)

type User struct {
    ID        uuid.UUID `json:"id"`
    GoogleID  string    `json:"google_id"`
    Email     string    `json:"email"`
    Name      string    `json:"name"`
    AvatarURL *string   `json:"avatar_url,omitempty"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}
```

#### 8. Create Auth Handlers

**File:** `gateway/internal/handlers/auth.go`

```go
package handlers

import (
    "crypto/rsa"
    "net/http"
    "encoding/json"

    "yourmodule/internal/auth"
    "yourmodule/internal/repository"
)

type AuthHandler struct {
    googleClient *auth.GoogleOAuthClient
    repo         *repository.Repository
    privateKey   *rsa.PrivateKey
    jwtExpiry    int
}

func NewAuthHandler(googleClient *auth.GoogleOAuthClient, repo *repository.Repository, privateKey *rsa.PrivateKey, jwtExpiry int) *AuthHandler {
    return &AuthHandler{
        googleClient: googleClient,
        repo:         repo,
        privateKey:   privateKey,
        jwtExpiry:    jwtExpiry,
    }
}

func (h *AuthHandler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
    state := "random-state-string" // TODO: Generate secure random state
    url := h.googleClient.GetAuthURL(state)
    http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func (h *AuthHandler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
    code := r.URL.Query().Get("code")
    if code == "" {
        http.Error(w, "missing code", http.StatusBadRequest)
        return
    }

    token, err := h.googleClient.ExchangeCode(r.Context(), code)
    if err != nil {
        http.Error(w, "failed to exchange code", http.StatusInternalServerError)
        return
    }

    userInfo, err := h.googleClient.GetUserInfo(r.Context(), token)
    if err != nil {
        http.Error(w, "failed to get user info", http.StatusInternalServerError)
        return
    }

    user, err := h.repo.CreateOrUpdateUser(r.Context(), userInfo.ID, userInfo.Email, userInfo.Name, userInfo.Picture)
    if err != nil {
        http.Error(w, "failed to create user", http.StatusInternalServerError)
        return
    }

    jwtToken, err := auth.GenerateJWT(user.ID, user.Email, user.Name, h.privateKey, h.jwtExpiry)
    if err != nil {
        http.Error(w, "failed to generate token", http.StatusInternalServerError)
        return
    }

    // Redirect to frontend with token
    frontendURL := "http://localhost:3000/auth/callback?token=" + jwtToken
    http.Redirect(w, r, frontendURL, http.StatusTemporaryRedirect)
}

func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
    claims, err := auth.GetUserFromContext(r.Context())
    if err != nil {
        http.Error(w, "unauthorized", http.StatusUnauthorized)
        return
    }

    user, err := h.repo.GetUserByID(r.Context(), claims.UserID)
    if err != nil {
        http.Error(w, "user not found", http.StatusNotFound)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(user)
}
```

#### 9. Update Router

**File:** `gateway/internal/app/router.go`

Add auth routes:
```go
// Auth routes (public)
r.Get("/auth/google/login", authHandler.GoogleLogin)
r.Get("/auth/google/callback", authHandler.GoogleCallback)

// Protected routes
r.Group(func(r chi.Router) {
    r.Use(authMiddleware.Authenticate)
    r.Get("/auth/me", authHandler.GetMe)
    r.Post("/submit-job", submitJobHandler.Handle) // Make this protected
})
```

#### 10. Update Environment Variables

**File:** `.env`

```env
# Database
DATABASE_URL=postgres://postgres:postgres@postgres:5432/animoji?sslmode=disable

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-from-google-console
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URL=http://localhost:8080/auth/google/callback

# JWT (generate using: ssh-keygen -t rsa -b 4096 -m PEM)
JWT_PRIVATE_KEY=base64-encoded-private-key
JWT_PUBLIC_KEY=base64-encoded-public-key
JWT_EXPIRY_HOURS=168
```

### Frontend Tasks

#### 1. Install Dependencies

```bash
cd frontend
pnpm add jwt-decode
```

#### 2. Create Auth Slice

**File:** `frontend/src/store/slices/authSlice.ts`

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

interface JWTPayload {
  user_id: string;
  email: string;
  name: string;
  exp: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      localStorage.setItem('token', action.payload);

      // Decode JWT to extract user info
      const decoded = jwtDecode<JWTPayload>(action.payload);
      state.user = {
        id: decoded.user_id,
        email: decoded.email,
        name: decoded.name,
      };
      state.isAuthenticated = true;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
});

export const { setToken, clearAuth, setUser } = authSlice.actions;
export default authSlice.reducer;
```

#### 3. Create Auth Service

**File:** `frontend/src/services/authClient.ts`

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const initiateGoogleLogin = () => {
  window.location.href = `${API_URL}/auth/google/login`;
};

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/';
};

export const getMe = async (): Promise<User> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  return response.json();
};
```

#### 4. Create Auth Callback Page

**File:** `frontend/src/pages/AuthCallbackPage.tsx`

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@store/hooks';
import { setToken } from '@store/slices/authSlice';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      dispatch(setToken(token));
      navigate('/');
    } else {
      navigate('/');
    }
  }, [dispatch, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Authenticating...</p>
    </div>
  );
}
```

#### 5. Create Login Button Component

**File:** `frontend/src/components/auth/LoginButton.tsx`

```typescript
import { initiateGoogleLogin } from '@services/authClient';

export default function LoginButton() {
  return (
    <button
      onClick={initiateGoogleLogin}
      className="px-4 py-2 bg-white text-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow flex items-center gap-2"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        {/* Google icon SVG */}
      </svg>
      Sign in with Google
    </button>
  );
}
```

#### 6. Create User Menu Component

**File:** `frontend/src/components/auth/UserMenu.tsx`

```typescript
import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { clearAuth } from '@store/slices/authSlice';
import { logout } from '@services/authClient';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(clearAuth());
    logout();
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium">{user.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
```

#### 7. Update Navbar

**File:** `frontend/src/lib/layout/Navbar.tsx`

Replace placeholder avatar:
```typescript
import { useAppSelector } from '@store/hooks';
import LoginButton from '@components/auth/LoginButton';
import UserMenu from '@components/auth/UserMenu';

export default function Navbar() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  return (
    <nav>
      {/* ... existing nav items ... */}
      {isAuthenticated ? <UserMenu /> : <LoginButton />}
    </nav>
  );
}
```

#### 8. Update Store

**File:** `frontend/src/store/store.ts`

```typescript
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    generation: generationReducer,
    auth: authReducer, // Add this
  },
});
```

#### 9. Add Route

**File:** `frontend/src/App.tsx`

```typescript
import AuthCallbackPage from '@pages/AuthCallbackPage';

<Route path="/auth/callback" element={<AuthCallbackPage />} />
```

### Testing Phase 1

1. Start services: `docker-compose up --build`
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify JWT token in localStorage
5. Check user created in DB: `docker exec -it animoji-postgres psql -U postgres -d animoji -c "SELECT * FROM users;"`
6. Call protected endpoint: `curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/auth/me`

---

## Phase 2: Save & Share

### Goal
Save generated images to database with visibility settings. Generate 1-hour expiring share links.

### Backend Tasks

[Content continues with Phase 2, 3, and 4 implementation details...]

---

## API Reference

### Authentication Endpoints

#### `GET /auth/google/login`
Initiates Google OAuth flow.

**Response:** Redirects to Google consent screen.

#### `GET /auth/google/callback?code={code}`
OAuth callback handler.

**Response:** Redirects to frontend with JWT token.

#### `GET /auth/me`
Get current user info (protected).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "avatar_url": "https://...",
  "created_at": "2024-01-01T00:00:00Z"
}
```

[API reference continues...]

---

## Collaborative Filtering Algorithm

### Overview
Recommend images based on user similarity (users who like similar images).

### Algorithm Steps

1. **Build User Similarity Matrix**
   - Find pairs of users who liked the same images
   - Count common likes between each pair
   - Store in materialized view for performance

2. **Find Similar Users**
   ```sql
   SELECT user2_id, common_likes
   FROM user_similarity
   WHERE user1_id = $current_user_id
   ORDER BY common_likes DESC
   LIMIT 10;
   ```

3. **Recommend Images**
   ```sql
   SELECT DISTINCT i.*
   FROM images i
   JOIN likes l ON l.image_id = i.id
   WHERE l.user_id IN (similar_user_ids)
     AND i.id NOT IN (SELECT image_id FROM likes WHERE user_id = $current_user_id)
     AND i.visibility = 'public'
   ORDER BY relevance_score DESC
   LIMIT 20;
   ```

4. **Scoring Formula**
   ```
   score = (0.5 * similarity) + (0.3 * recency) + (0.2 * popularity)
   ```

### Refresh Materialized View
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY user_similarity;
```

Run this daily via cron job or manual trigger.

---

## Environment Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:8080/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### JWT Key Generation

```bash
# Generate RSA key pair
ssh-keygen -t rsa -b 4096 -m PEM -f jwt.key
ssh-keygen -f jwt.key.pub -e -m PEM > jwt_public.pem

# Base64 encode for .env
cat jwt.key | base64 -w 0
cat jwt_public.pem | base64 -w 0
```

### Development Workflow

```bash
# Start infrastructure
docker-compose up postgres minio nats -d

# Run gateway in dev mode
cd gateway
go run ./cmd/api/main.go

# Run frontend in dev mode
cd frontend
pnpm dev

# Run AI worker
cd ai-worker
uv run uvicorn main:app --reload
```

---

## Next Steps

This guide provides a roadmap for implementing each phase incrementally. Start with Phase 1 (Authentication), test thoroughly, then proceed to Phase 2 (Save/Share), and so on.

For questions or clarifications, refer to the main plan file at `.claude/plans/ticklish-chasing-ember.md`.
