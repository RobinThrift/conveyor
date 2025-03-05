package domain

import (
	"time"
)

type ChangelogEntryID string

type ChangelogEntry struct {
	SyncClientID SyncClientID
	AccountID    AccountID
	Data         []byte
	Timestamp    time.Time
}

type ListChangelogEntriesQuery struct {
	AccountID AccountID
	Since     time.Time
}
