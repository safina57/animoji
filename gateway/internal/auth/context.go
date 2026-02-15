package auth

import (
	"context"
	"fmt"
)

type contextKey string

// UserContextKey is the context key for storing user claims
const UserContextKey contextKey = "user"

// InjectUserIntoContext adds JWT claims to the request context
func InjectUserIntoContext(ctx context.Context, claims *JWTClaims) context.Context {
	return context.WithValue(ctx, UserContextKey, claims)
}

// GetUserFromContext extracts JWT claims from the request context
func GetUserFromContext(ctx context.Context) (*JWTClaims, error) {
	claims, ok := ctx.Value(UserContextKey).(*JWTClaims)
	if !ok || claims == nil {
		return nil, fmt.Errorf("user not found in context")
	}
	return claims, nil
}
