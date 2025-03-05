package domain

import (
	"time"
)

type FullSyncEntry struct {
	AccountID  AccountID
	Timestamp  time.Time
	Filepath   string
	SizeBytes  int64
	Sha256Hash []byte
}
