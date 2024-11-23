package domain

import (
	"errors"
	"time"

	"github.com/RobinThrift/belt/internal/auth"
)

var ErrCreateAttachment = errors.New("error creating attachment")
var ErrAttachmentNotFound = errors.New("attachment not found")

type AttachmentID int64

type Attachment struct {
	ID               AttachmentID
	Filepath         string
	OriginalFilename string
	ContentType      string
	SizeBytes        int64
	Sha256           []byte
	CreatedBy        auth.AccountID
	CreatedAt        time.Time
}

type AttachmentList struct {
	Items []*Attachment
	Next  *string
}
