package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/RobinThrift/belt/internal/storage/database"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite/sqlc"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite/types"
	"github.com/alexedwards/scs/v2"
)

const cleanupInterval = time.Minute * 30

var ErrFindingSession = errors.New("error finding sessions")
var ErrCommittingSession = errors.New("error committing sessions")

type SessionRepo struct {
	db database.Database
}

var _ scs.Store = (*SessionRepo)(nil)

func NewSessionRepo(db database.Database) *SessionRepo {
	s := &SessionRepo{db: db}
	go s.cleanupTask()
	return s
}

func (s *SessionRepo) Find(token string) ([]byte, bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	return s.FindCtx(ctx, token)
}

func (s *SessionRepo) Commit(token string, b []byte, expiry time.Time) error {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	return s.CommitCtx(ctx, token, b, expiry)
}

func (s *SessionRepo) Delete(token string) error {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	return s.DeleteCtx(ctx, token)
}

func (s *SessionRepo) FindCtx(ctx context.Context, token string) ([]byte, bool, error) {
	db := s.db.Conn(ctx)

	sess, err := queries.GetSession(ctx, db, token)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, false, nil
		}

		return nil, false, err
	}

	return sess.Data, true, nil
}

func (s *SessionRepo) CommitCtx(ctx context.Context, token string, b []byte, expiry time.Time) error {
	db := s.db.Conn(ctx)

	err := queries.CreateSession(ctx, db, sqlc.CreateSessionParams{
		Token:     token,
		Data:      b,
		ExpiresAt: types.NewSQLiteDatetime(expiry),
	})

	if err != nil {
		return fmt.Errorf("%v: %w", ErrCommittingSession, err)
	}

	return nil
}

func (s *SessionRepo) DeleteCtx(ctx context.Context, token string) error {
	db := s.db.Conn(ctx)

	err := queries.DeleteSession(ctx, db, token)
	if err != nil {
		return err
	}

	return nil
}

func (s *SessionRepo) deleteExpired(ctx context.Context) error {
	db := s.db.Conn(ctx)
	return queries.DeleteExpired(ctx, db)
}

func (s *SessionRepo) cleanupTask() {
	ticker := time.NewTicker(cleanupInterval)
	for range ticker.C {
		func() {
			ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
			defer cancel()
			err := s.deleteExpired(ctx)
			if err != nil {
				slog.Error("error while running session cleanup task", slog.Any("error", err))
			}
		}()
	}
}
