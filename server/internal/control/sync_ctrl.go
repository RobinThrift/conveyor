package control

import (
	"context"
	"crypto/sha256"
	"fmt"
	"io"
	"path"
	"time"

	"go.robinthrift.com/belt/internal/auth"
	"go.robinthrift.com/belt/internal/domain"
	"go.robinthrift.com/belt/internal/storage/database"
)

type SyncController struct {
	transactioner database.Transactioner
	syncRepo      SyncControllerSyncRepo
	blobs         SyncControllerBlobStorage
}

type SyncControllerBlobStorage interface {
	WriteBlob(accountID domain.AccountID, filepath string, content io.Reader) (int64, error)
	RemoveBlob(accountID domain.AccountID, filepath string) error
}

type SyncControllerSyncRepo interface {
	CreateSyncClient(ctx context.Context, client *domain.SyncClient) error
	DeleteSyncClient(ctx context.Context, client *domain.SyncClient) error
	ListChangelogEntries(ctx context.Context, query domain.ListChangelogEntriesQuery) ([]domain.ChangelogEntry, error)
	CreateChangelogEntries(ctx context.Context, entries []domain.ChangelogEntry) error
	CreateFullSyncEntry(ctx context.Context, entry *domain.FullSyncEntry) error
	GetLatestFullSyncEntry(ctx context.Context, accountID domain.AccountID) (*domain.FullSyncEntry, error)
}

func NewSyncController(transactioner database.Transactioner, syncRepo SyncControllerSyncRepo, fs SyncControllerBlobStorage) *SyncController {
	return &SyncController{transactioner, syncRepo, fs}
}

type RegisterClientCmd struct {
	ClientID domain.SyncClientID
}

func (sc *SyncController) RegisterClient(ctx context.Context, cmd RegisterClientCmd) error {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return auth.ErrUnauthorized
	}

	return sc.syncRepo.CreateSyncClient(ctx, &domain.SyncClient{
		ID:        cmd.ClientID,
		AccountID: account.ID,
	})
}

type UnregisterClientCmd struct {
	ClientID domain.SyncClientID
}

func (sc *SyncController) UnregisterClient(ctx context.Context, cmd UnregisterClientCmd) error {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return auth.ErrUnauthorized
	}

	return sc.syncRepo.DeleteSyncClient(ctx, &domain.SyncClient{
		ID:        cmd.ClientID,
		AccountID: account.ID,
	})
}

func (sc *SyncController) GetLatestFullSyncEntry(ctx context.Context) (*domain.FullSyncEntry, error) {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return nil, auth.ErrUnauthorized
	}

	return sc.syncRepo.GetLatestFullSyncEntry(ctx, account.ID)
}

type SaveFullDBCmd struct {
	Data io.Reader
}

func (sc *SyncController) SaveFullDB(ctx context.Context, cmd SaveFullDBCmd) error {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return auth.ErrUnauthorized
	}

	return sc.transactioner.InTransaction(ctx, func(ctx context.Context) error {
		timestamp := time.Now()
		filepath := path.Join("dbs", fmt.Sprintf("belt_%d.db", timestamp.Unix()))

		h := sha256.New()

		tee := io.TeeReader(cmd.Data, h)

		sizeBytes, err := sc.blobs.WriteBlob(account.ID, filepath, tee)
		if err != nil {
			return err
		}

		return sc.syncRepo.CreateFullSyncEntry(ctx, &domain.FullSyncEntry{
			AccountID:  account.ID,
			Timestamp:  timestamp,
			Filepath:   filepath,
			SizeBytes:  sizeBytes,
			Sha256Hash: h.Sum(nil),
		})
	})

}

type ListChangelogEntriesQuery struct {
	Since time.Time
}

func (sc *SyncController) ListChangelogEntries(ctx context.Context, query ListChangelogEntriesQuery) ([]domain.ChangelogEntry, error) {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return nil, auth.ErrUnauthorized
	}

	return sc.syncRepo.ListChangelogEntries(ctx, domain.ListChangelogEntriesQuery{
		AccountID: account.ID,
		Since:     query.Since,
	})
}

type CreateChangelogEntriesCmd struct {
	Entries []domain.ChangelogEntry
}

func (sc *SyncController) CreateChangelogEntries(ctx context.Context, cmd CreateChangelogEntriesCmd) error {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return auth.ErrUnauthorized
	}

	for i := range cmd.Entries {
		cmd.Entries[i].AccountID = account.ID
	}

	return sc.transactioner.InTransaction(ctx, func(ctx context.Context) error {
		return sc.syncRepo.CreateChangelogEntries(ctx, cmd.Entries)
	})
}

type SaveAttachmentCmd struct {
	Filepath string
	Content  io.Reader
}

func (sc *SyncController) SaveAttachment(ctx context.Context, cmd SaveAttachmentCmd) error {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return auth.ErrUnauthorized
	}

	_, err := sc.blobs.WriteBlob(account.ID, cmd.Filepath, cmd.Content)
	if err != nil {
		return err
	}

	return nil
}
