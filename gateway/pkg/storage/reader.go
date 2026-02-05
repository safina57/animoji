package storage

import (
	"bytes"
	"io"
)

// NewBytesReader creates a ReadSeeker from byte slice
// bytes.Reader already implements io.ReadSeeker, so we return it directly
func NewBytesReader(data []byte) io.ReadSeeker {
	return bytes.NewReader(data)
}
