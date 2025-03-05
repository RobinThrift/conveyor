package domain

type SyncClientID string

type SyncClient struct {
	ID        SyncClientID
	AccountID AccountID
}
