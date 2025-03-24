package storage

import (
	"io"
)

type BlobTarget interface {
	io.WriteCloser
	Finalize(filepath string) (err error)
}
