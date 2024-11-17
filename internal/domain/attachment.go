package domain

import (
	"time"

	"github.com/RobinThrift/belt/internal/auth"
)

type Attachment struct {
	Filename    string
	Filepath    string
	ContentType string
	SizeBytes   int64
	Sha256      []byte
	CreatedBy   auth.AccountID
	CreatedAt   time.Time
}
