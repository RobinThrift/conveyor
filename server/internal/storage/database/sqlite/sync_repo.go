package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"go.robinthrift.com/conveyor/internal/domain"
	"go.robinthrift.com/conveyor/internal/storage/database"
	"go.robinthrift.com/conveyor/internal/storage/database/sqlite/sqlc"
	"go.robinthrift.com/conveyor/internal/storage/database/sqlite/types"
	"modernc.org/sqlite"
)

type SyncRepo struct {
	db database.Database
}

func NewSyncRepo(db database.Database) *SyncRepo {
	return &SyncRepo{db}
}

func (r *SyncRepo) CreateSyncClient(ctx context.Context, client *domain.SyncClient) error {
	err := queries.CreateSyncClient(ctx, r.db.Conn(ctx), sqlc.CreateSyncClientParams{
		AccountID: client.AccountID,
		PublicID:  client.ID,
	})

	if err != nil {
		var sqlErr *sqlite.Error
		if errors.As(err, &sqlErr) && sqlErr.Code() == 787 {
			return domain.ErrInvalidAccountReference
		}

		return err
	}

	return nil
}

func (r *SyncRepo) DeleteSyncClient(ctx context.Context, client *domain.SyncClient) error {
	err := queries.DeleteSyncClientByPublicID(ctx, r.db.Conn(ctx), sqlc.DeleteSyncClientByPublicIDParams{
		AccountID: client.AccountID,
		PublicID:  client.ID,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil
		}

		return err
	}

	return nil
}

func (r *SyncRepo) ListChangelogEntries(ctx context.Context, query domain.ListChangelogEntriesQuery) ([]domain.ChangelogEntry, error) {
	rows, err := queries.ListChangelogEntries(ctx, r.db.Conn(ctx), sqlc.ListChangelogEntriesParams{
		AccountID: query.AccountID,
		Since:     types.NewSQLiteDatetime(query.Since),
	})
	if err != nil {
		return nil, err
	}

	entries := make([]domain.ChangelogEntry, 0, len(rows))
	for _, row := range rows {
		entries = append(entries, domain.ChangelogEntry{
			SyncClientID: row.SyncClientID,
			AccountID:    row.AccountID,
			Data:         row.Data,
			Timestamp:    row.Timestamp.Time,
		})
	}

	return entries, nil
}

func (r *SyncRepo) CreateChangelogEntries(ctx context.Context, entries []domain.ChangelogEntry) error {
	for _, entry := range entries {
		err := queries.CreateChangelogEntry(ctx, r.db.Conn(ctx), sqlc.CreateChangelogEntryParams{
			AccountID:    entry.AccountID,
			SyncClientID: entry.SyncClientID,
			Data:         entry.Data,
			Timestamp:    types.NewSQLiteDatetime(time.Now()),
		})
		if err != nil {
			return fmt.Errorf("error creating changelog entry: %w", err)
		}
	}

	return nil
}

func (r *SyncRepo) CreateFullSyncEntry(ctx context.Context, entry *domain.FullSyncEntry) error {
	err := queries.CreateFullSyncEntry(ctx, r.db.Conn(ctx), sqlc.CreateFullSyncEntryParams{
		AccountID: entry.AccountID,
		Timestamp: types.NewSQLiteDatetime(entry.Timestamp),
		SizeBytes: entry.SizeBytes,
		Sha256:    entry.Sha256Hash,
	})
	if err != nil {
		return fmt.Errorf("error creating full sync entry: %w", err)
	}

	return nil
}

func (r *SyncRepo) GetLatestFullSyncEntry(ctx context.Context, accountID domain.AccountID) (*domain.FullSyncEntry, error) {
	row, err := queries.GetLatestFullSyncEntry(ctx, r.db.Conn(ctx), accountID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNoFullSyncEntriesFound
		}

		return nil, err
	}

	return &domain.FullSyncEntry{
		AccountID:  row.AccountID,
		Timestamp:  row.Timestamp.Time,
		SizeBytes:  row.SizeBytes,
		Sha256Hash: row.Sha256,
	}, nil
}
