package auth

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"fmt"
	"os"
	"sync"

	"github.com/rs/zerolog/log"
)

var (
	privateKeyInstance *rsa.PrivateKey
	publicKeyInstance  *rsa.PublicKey
	keysOnce           sync.Once
	keysError          error
)

// LoadRSAKeys loads RSA private and public keys
func LoadRSAKeys() (*rsa.PrivateKey, *rsa.PublicKey, error) {
	keysOnce.Do(func() {
		// Load private key
		privateKeyB64 := os.Getenv("JWT_PRIVATE_KEY")
		if privateKeyB64 == "" {
			keysError = fmt.Errorf("JWT_PRIVATE_KEY environment variable is not set")
			return
		}

		privateKeyPEM, err := base64.StdEncoding.DecodeString(privateKeyB64)
		if err != nil {
			keysError = fmt.Errorf("failed to decode JWT_PRIVATE_KEY: %w", err)
			return
		}

		privateBlock, _ := pem.Decode(privateKeyPEM)
		if privateBlock == nil {
			keysError = fmt.Errorf("failed to parse PEM block containing private key")
			return
		}

		privateKey, err := x509.ParsePKCS1PrivateKey(privateBlock.Bytes)
		if err != nil {
			keysError = fmt.Errorf("failed to parse private key: %w", err)
			return
		}
		privateKeyInstance = privateKey

		// Load public key
		publicKeyB64 := os.Getenv("JWT_PUBLIC_KEY")
		if publicKeyB64 == "" {
			keysError = fmt.Errorf("JWT_PUBLIC_KEY environment variable is not set")
			return
		}

		publicKeyPEM, err := base64.StdEncoding.DecodeString(publicKeyB64)
		if err != nil {
			keysError = fmt.Errorf("failed to decode JWT_PUBLIC_KEY: %w", err)
			return
		}

		publicBlock, _ := pem.Decode(publicKeyPEM)
		if publicBlock == nil {
			keysError = fmt.Errorf("failed to parse PEM block containing public key")
			return
		}

		publicKey, err := x509.ParsePKCS1PublicKey(publicBlock.Bytes)
		if err != nil {
			publicKeyInterface, err := x509.ParsePKIXPublicKey(publicBlock.Bytes)
			if err != nil {
				keysError = fmt.Errorf("failed to parse public key: %w", err)
				return
			}
			var ok bool
			publicKey, ok = publicKeyInterface.(*rsa.PublicKey)
			if !ok {
				keysError = fmt.Errorf("public key is not RSA format")
				return
			}
		}

		publicKeyInstance = publicKey

		log.Info().Msg("RSA keys loaded successfully")
	})

	return privateKeyInstance, publicKeyInstance, keysError
}
