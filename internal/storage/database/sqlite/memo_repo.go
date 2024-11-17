package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/domain"
	"github.com/RobinThrift/belt/internal/storage/database"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite/sqlc"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite/types"
	"github.com/mattn/go-sqlite3"
)

type ListMemosQuery struct {
	AccountID auth.AccountID

	PageSize uint64
	After    *domain.MemoID

	Tag             *string
	Search          *string
	CreatedAt       *time.Time
	MinCreationDate *time.Time
}

type MemoRepo struct {
	db database.Database
}

func NewMemoRepo(db database.Database) *MemoRepo {
	return &MemoRepo{db}
}

func (r *MemoRepo) GetMemo(ctx context.Context, id domain.MemoID) (*domain.Memo, error) {
	res, err := queries.GetMemo(ctx, r.db.Conn(ctx), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrMemoNotFound
		}
		return nil, err
	}

	return &domain.Memo{
		ID:         res.ID,
		Name:       res.Name,
		Content:    res.Content,
		IsArchived: res.IsArchived,
		CreatedBy:  res.CreatedBy,
		CreatedAt:  res.CreatedAt.Time,
		UpdatedAt:  res.UpdatedAt.Time,
	}, nil
}

func (r *MemoRepo) ListMemos(ctx context.Context, query ListMemosQuery) (*domain.MemoList, error) {
	params := sqlc.ListMemosParams{
		Limit: int64(query.PageSize),
	}

	if query.After != nil {
		params.After = int64(*query.After)
	}

	if query.CreatedAt != nil {
		params.WithCreatedAt = true
		params.CreatedAt = types.NewSQLiteDatetime(*query.CreatedAt).String()
	}

	if query.MinCreationDate != nil {
		params.WithCreatedAt = false
		params.WithCreatedAtOrOlder = true
		params.CreatedAtOrOlder = types.NewSQLiteDatetime(*query.MinCreationDate).String()
	}

	if query.Search != nil && query.Tag != nil {
		return r.listMemosForTagsWithSearch(ctx, query, params)
	}

	if query.Search != nil {
		return r.listMemosWithSearch(ctx, query, params)
	}

	if query.Tag != nil {
		return r.listMemosForTags(ctx, query, params)
	}

	return r.listMemos(ctx, params)
}

func (r *MemoRepo) listMemos(ctx context.Context, params sqlc.ListMemosParams) (*domain.MemoList, error) {
	res, err := queries.ListMemos(ctx, r.db.Conn(ctx), params)
	if err != nil {
		return nil, err
	}

	list := &domain.MemoList{
		Items: make([]*domain.Memo, 0, len(res)),
		Next:  nil,
	}

	for _, memo := range res {
		list.Items = append(list.Items, &domain.Memo{
			ID:         memo.ID,
			Name:       memo.Name,
			Content:    memo.Content,
			IsArchived: memo.IsArchived,
			CreatedBy:  memo.CreatedBy,
			CreatedAt:  memo.CreatedAt.Time,
			UpdatedAt:  memo.UpdatedAt.Time,
		})
	}

	return list, nil

}

func (r *MemoRepo) listMemosForTags(ctx context.Context, query ListMemosQuery, params sqlc.ListMemosParams) (*domain.MemoList, error) {
	res, err := queries.ListMemosForTags(ctx, r.db.Conn(ctx), sqlc.ListMemosForTagsParams{
		After:                params.After,
		Tag:                  *query.Tag,
		WithCreatedAt:        params.WithCreatedAt,
		CreatedAt:            params.CreatedAt,
		WithCreatedAtOrOlder: params.WithCreatedAtOrOlder,
		CreatedAtOrOlder:     params.CreatedAtOrOlder,
		Limit:                params.Limit,
	})
	if err != nil {
		return nil, err
	}

	list := &domain.MemoList{
		Items: make([]*domain.Memo, 0, len(res)),
		Next:  nil,
	}

	for _, memo := range res {
		list.Items = append(list.Items, &domain.Memo{
			ID:         memo.ID,
			Name:       memo.Name,
			Content:    memo.Content,
			IsArchived: memo.IsArchived,
			CreatedBy:  memo.CreatedBy,
			CreatedAt:  memo.CreatedAt.Time,
			UpdatedAt:  memo.UpdatedAt.Time,
		})
	}

	return list, nil
}

func (r *MemoRepo) listMemosWithSearch(ctx context.Context, query ListMemosQuery, params sqlc.ListMemosParams) (*domain.MemoList, error) {
	res, err := queries.ListMemosWithSearch(ctx, r.db.Conn(ctx), sqlc.ListMemosWithSearchParams{
		After:                params.After,
		Search:               types.PrepareFTSQueryString(*query.Search),
		WithCreatedAt:        params.WithCreatedAt,
		CreatedAt:            params.CreatedAt,
		WithCreatedAtOrOlder: params.WithCreatedAtOrOlder,
		CreatedAtOrOlder:     params.CreatedAtOrOlder,
		Limit:                params.Limit,
	})
	if err != nil {
		return nil, err
	}

	list := &domain.MemoList{
		Items: make([]*domain.Memo, 0, len(res)),
		Next:  nil,
	}

	for _, memo := range res {
		list.Items = append(list.Items, &domain.Memo{
			ID:         memo.ID,
			Name:       memo.Name,
			Content:    memo.Content,
			IsArchived: memo.IsArchived,
			CreatedBy:  memo.CreatedBy,
			CreatedAt:  memo.CreatedAt.Time,
			UpdatedAt:  memo.UpdatedAt.Time,
		})
	}

	return list, nil
}

func (r *MemoRepo) listMemosForTagsWithSearch(ctx context.Context, query ListMemosQuery, params sqlc.ListMemosParams) (*domain.MemoList, error) {
	res, err := queries.ListMemosForTagsWithSearch(ctx, r.db.Conn(ctx), sqlc.ListMemosForTagsWithSearchParams{
		After:                params.After,
		Tag:                  *query.Tag,
		Search:               types.PrepareFTSQueryString(*query.Search),
		WithCreatedAt:        params.WithCreatedAt,
		CreatedAt:            params.CreatedAt,
		WithCreatedAtOrOlder: params.WithCreatedAtOrOlder,
		CreatedAtOrOlder:     params.CreatedAtOrOlder,
		Limit:                params.Limit,
	})
	if err != nil {
		return nil, err
	}

	list := &domain.MemoList{
		Items: make([]*domain.Memo, 0, len(res)),
		Next:  nil,
	}

	for _, memo := range res {
		list.Items = append(list.Items, &domain.Memo{
			ID:         memo.ID,
			Name:       memo.Name,
			Content:    memo.Content,
			IsArchived: memo.IsArchived,
			CreatedBy:  memo.CreatedBy,
			CreatedAt:  memo.CreatedAt.Time,
			UpdatedAt:  memo.UpdatedAt.Time,
		})
	}

	return list, nil
}

type ListArchivedMemosQuery struct {
	AccountID auth.AccountID
	PageSize  uint64
	After     *domain.MemoID
}

func (r *MemoRepo) ListArchivedMemos(ctx context.Context, query ListArchivedMemosQuery) (*domain.MemoList, error) {
	params := sqlc.ListArchivedMemosParams{
		Limit: int64(query.PageSize),
	}

	if query.After != nil {
		params.ID = *query.After
	}

	res, err := queries.ListArchivedMemos(ctx, r.db.Conn(ctx), params)
	if err != nil {
		return nil, err
	}

	list := &domain.MemoList{
		Items: make([]*domain.Memo, 0, len(res)),
		Next:  nil,
	}

	for _, memo := range res {
		list.Items = append(list.Items, &domain.Memo{
			ID:         memo.ID,
			Name:       memo.Name,
			Content:    memo.Content,
			IsArchived: memo.IsArchived,
			CreatedBy:  memo.CreatedBy,
			CreatedAt:  memo.CreatedAt.Time,
			UpdatedAt:  memo.UpdatedAt.Time,
		})
	}

	return list, nil
}

type ListDeletedMemosQuery struct {
	AccountID auth.AccountID
	PageSize  uint64
	After     *domain.MemoID
}

func (r *MemoRepo) ListDeletedMemos(ctx context.Context, query ListDeletedMemosQuery) (*domain.MemoList, error) {
	params := sqlc.ListDeletedMemosParams{
		Limit: int64(query.PageSize),
	}

	if query.After != nil {
		params.ID = *query.After
	}

	res, err := queries.ListDeletedMemos(ctx, r.db.Conn(ctx), params)
	if err != nil {
		return nil, err
	}

	list := &domain.MemoList{
		Items: make([]*domain.Memo, 0, len(res)),
		Next:  nil,
	}

	for _, memo := range res {
		list.Items = append(list.Items, &domain.Memo{
			ID:         memo.ID,
			Name:       memo.Name,
			Content:    memo.Content,
			IsArchived: memo.IsArchived,
			CreatedBy:  memo.CreatedBy,
			CreatedAt:  memo.CreatedAt.Time,
			UpdatedAt:  memo.UpdatedAt.Time,
		})
	}

	return list, nil
}

func (r *MemoRepo) CreateMemo(ctx context.Context, memo *domain.Memo) error {
	err := queries.CreateMemo(ctx, r.db.Conn(ctx), sqlc.CreateMemoParams{
		Name:      memo.Name,
		Content:   memo.Content,
		CreatedBy: memo.CreatedBy,
		CreatedAt: types.SQLiteDatetime{Time: memo.CreatedAt, Valid: true},
	})
	if err != nil {
		var sqliteErr sqlite3.Error
		if errors.As(err, &sqliteErr) && sqliteErr.ExtendedCode == 787 {
			return fmt.Errorf("invalid account reference")
		}
		return err
	}

	return nil
}

func (r *MemoRepo) UpdateMemoContent(ctx context.Context, memo *domain.Memo) error {
	numRows, err := queries.UpdateMemoContent(ctx, r.db.Conn(ctx), sqlc.UpdateMemoContentParams{
		Content: memo.Content,
		ID:      memo.ID,
	})
	if err != nil {
		return err
	}

	if numRows == 0 {
		return domain.ErrMemoNotFound
	}

	return nil
}

func (r *MemoRepo) ArchiveMemo(ctx context.Context, id domain.MemoID) error {
	numRows, err := queries.ArchiveMemo(ctx, r.db.Conn(ctx), id)
	if err != nil {
		return err
	}

	if numRows == 0 {
		return domain.ErrMemoNotFound
	}

	return nil
}

func (r *MemoRepo) DeleteMemo(ctx context.Context, id domain.MemoID) error {
	err := queries.SoftDeleteMemo(ctx, r.db.Conn(ctx), id)
	if err != nil {
		return err
	}

	return nil
}

func (r *MemoRepo) CleanupDeletedMemos(ctx context.Context) (int64, error) {
	return queries.CleanupDeletedMemos(ctx, r.db.Conn(ctx))
}
