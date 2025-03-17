package domain

import (
	"errors"
	"time"
)

var ErrNoFullSyncEntriesFound = errors.New("no full sync entries found")

type FullSyncEntry struct {
	AccountID  AccountID
	Timestamp  time.Time
	Filepath   string
	SizeBytes  int64
	Sha256Hash []byte
}
