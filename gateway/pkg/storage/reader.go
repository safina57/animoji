package storage

import (
	"bytes"
	"io"
)

// bytesReader wraps bytes in a ReadSeeker
type bytesReader struct {
	*bytes.Reader
}

// NewBytesReader creates a ReadSeeker from byte slice
func NewBytesReader(data []byte) io.ReadSeeker {
	return &bytesReader{bytes.NewReader(data)}
}
