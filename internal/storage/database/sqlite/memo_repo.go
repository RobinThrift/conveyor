package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"regexp"

	"github.com/RobinThrift/belt/internal/domain"
	"github.com/RobinThrift/belt/internal/storage/database"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite/sqlc"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite/types"
	"github.com/mattn/go-sqlite3"
)

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
		Content:    res.Content,
		IsArchived: res.IsArchived,
		IsDeleted:  res.IsDeleted,
		CreatedBy:  res.CreatedBy,
		CreatedAt:  res.CreatedAt.Time,
		UpdatedAt:  res.UpdatedAt.Time,
	}, nil
}

func (r *MemoRepo) ListMemos(ctx context.Context, query domain.ListMemosQuery) (*domain.MemoList, error) {
	params := sqlc.ListMemosParams{
		PageSize: int64(query.PageSize),
	}

	if query.PageAfter != nil {
		params.PageAfter = types.NewSQLiteDatetime(*query.PageAfter).String()
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

	if query.IsArchived != nil {
		params.WithIsArchived = true
		params.IsArchived = true
	}

	if query.IsDeleted != nil {
		params.WithIsArchived = false
		params.WithIsDeleted = true
		params.IsDeleted = true
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
			Content:    memo.Content,
			IsArchived: memo.IsArchived,
			IsDeleted:  memo.IsDeleted,
			CreatedBy:  memo.CreatedBy,
			CreatedAt:  memo.CreatedAt.Time,
			UpdatedAt:  memo.UpdatedAt.Time,
		})
	}

	if len(res) != 0 {
		list.Next = &res[len(res)-1].CreatedAt.Time
	}

	return list, nil
}

func (r *MemoRepo) listMemosForTags(ctx context.Context, query domain.ListMemosQuery, params sqlc.ListMemosParams) (*domain.MemoList, error) {
	res, err := queries.ListMemosForTags(ctx, r.db.Conn(ctx), sqlc.ListMemosForTagsParams{
		PageAfter:            params.PageAfter,
		Tag:                  *query.Tag,
		WithCreatedAt:        params.WithCreatedAt,
		CreatedAt:            params.CreatedAt,
		WithCreatedAtOrOlder: params.WithCreatedAtOrOlder,
		CreatedAtOrOlder:     params.CreatedAtOrOlder,
		PageSize:             params.PageSize,
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
			Content:    memo.Content,
			IsArchived: memo.IsArchived,
			IsDeleted:  memo.IsDeleted,
			CreatedBy:  memo.CreatedBy,
			CreatedAt:  memo.CreatedAt.Time,
			UpdatedAt:  memo.UpdatedAt.Time,
		})
	}

	if len(res) != 0 {
		list.Next = &res[len(res)-1].CreatedAt.Time
	}

	return list, nil
}

func (r *MemoRepo) listMemosWithSearch(ctx context.Context, query domain.ListMemosQuery, params sqlc.ListMemosParams) (*domain.MemoList, error) {
	res, err := queries.ListMemosWithSearch(ctx, r.db.Conn(ctx), sqlc.ListMemosWithSearchParams{
		PageAfter:            params.PageAfter,
		Search:               types.PrepareFTSQueryString(*query.Search),
		WithCreatedAt:        params.WithCreatedAt,
		CreatedAt:            params.CreatedAt,
		WithCreatedAtOrOlder: params.WithCreatedAtOrOlder,
		CreatedAtOrOlder:     params.CreatedAtOrOlder,
		PageSize:             params.PageSize,
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
			Content:    memo.Content,
			IsArchived: memo.IsArchived,
			IsDeleted:  memo.IsDeleted,
			CreatedBy:  memo.CreatedBy,
			CreatedAt:  memo.CreatedAt.Time,
			UpdatedAt:  memo.UpdatedAt.Time,
		})
	}

	if len(res) != 0 {
		list.Next = &res[len(res)-1].CreatedAt.Time
	}

	return list, nil
}

func (r *MemoRepo) listMemosForTagsWithSearch(ctx context.Context, query domain.ListMemosQuery, params sqlc.ListMemosParams) (*domain.MemoList, error) {
	res, err := queries.ListMemosForTagsWithSearch(ctx, r.db.Conn(ctx), sqlc.ListMemosForTagsWithSearchParams{
		PageAfter:            params.PageAfter,
		Tag:                  *query.Tag,
		Search:               types.PrepareFTSQueryString(*query.Search),
		WithCreatedAt:        params.WithCreatedAt,
		CreatedAt:            params.CreatedAt,
		WithCreatedAtOrOlder: params.WithCreatedAtOrOlder,
		CreatedAtOrOlder:     params.CreatedAtOrOlder,
		PageSize:             params.PageSize,
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
			Content:    memo.Content,
			IsArchived: memo.IsArchived,
			IsDeleted:  memo.IsDeleted,
			CreatedBy:  memo.CreatedBy,
			CreatedAt:  memo.CreatedAt.Time,
			UpdatedAt:  memo.UpdatedAt.Time,
		})
	}

	if len(res) != 0 {
		list.Next = &res[len(res)-1].CreatedAt.Time
	}

	return list, nil
}

func (r *MemoRepo) CreateMemo(ctx context.Context, memo *domain.Memo) (domain.MemoID, error) {
	return database.InTransaction(ctx, r.db, func(ctx context.Context) (domain.MemoID, error) {
		return r.createMemo(ctx, memo)
	})
}

func (r *MemoRepo) createMemo(ctx context.Context, memo *domain.Memo) (domain.MemoID, error) {
	db := r.db.Conn(ctx)

	id, err := queries.CreateMemo(ctx, db, sqlc.CreateMemoParams{
		Content:   memo.Content,
		CreatedBy: memo.CreatedBy,
		CreatedAt: types.SQLiteDatetime{Time: memo.CreatedAt, Valid: true},
	})
	if err != nil {
		if errors.Is(err, sqlite3.ErrConstraintForeignKey) {
			return domain.MemoID(-1), fmt.Errorf("invalid account reference")
		}
		return domain.MemoID(-1), err
	}

	memo.ID = id
	err = r.updateTags(ctx, db, memo)
	if err != nil {
		return domain.MemoID(-1), err
	}

	return id, nil
}

func (r *MemoRepo) UpdateMemoContent(ctx context.Context, memo *domain.Memo) error {
	db := r.db.Conn(ctx)

	numRows, err := queries.UpdateMemoContent(ctx, db, sqlc.UpdateMemoContentParams{
		Content: memo.Content,
		ID:      memo.ID,
	})
	if err != nil {
		return err
	}

	if numRows == 0 {
		return domain.ErrMemoNotFound
	}

	err = r.updateTags(ctx, db, memo)
	if err != nil {
		return err
	}

	return nil
}

func (r *MemoRepo) UpdateArchiveStatus(ctx context.Context, id domain.MemoID, isArchived bool) error {
	numRows, err := queries.SeteMemoArchiveStatus(ctx, r.db.Conn(ctx), sqlc.SeteMemoArchiveStatusParams{ID: id, IsArchived: isArchived})
	if err != nil {
		return err
	}

	if numRows == 0 {
		return domain.ErrMemoNotFound
	}

	return nil
}

func (r *MemoRepo) DeleteMemo(ctx context.Context, id domain.MemoID) error {
	return r.db.InTransaction(ctx, func(ctx context.Context) error {
		return r.deleteMemo(ctx, id)
	})
}

func (r *MemoRepo) UndeleteMemo(ctx context.Context, id domain.MemoID) error {
	return r.db.InTransaction(ctx, func(ctx context.Context) error {
		return r.undeleteMemo(ctx, id)
	})
}

func (r *MemoRepo) deleteMemo(ctx context.Context, id domain.MemoID) error {
	db := r.db.Conn(ctx)

	_, err := queries.SetMemoDeletionStatus(ctx, r.db.Conn(ctx), sqlc.SetMemoDeletionStatusParams{ID: id, IsDeleted: true})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			err = domain.ErrMemoNotFound
		}

		return fmt.Errorf("error marking Memo (%d) as deleted: %w", id, err)
	}

	tags, err := queries.DeleteMemoTagConnection(ctx, db, int64(id))
	if err != nil {
		return fmt.Errorf("error deleting Memo (%d) to Tag connections: %w", id, err)
	}

	err = queries.UpdateTagCount(ctx, db, tags)
	if err != nil {
		return fmt.Errorf("error updating tag count: %w", err)
	}

	err = r.cleanupTagsWithNoCount(ctx, db)
	if err != nil {
		return err
	}

	return nil
}

func (r *MemoRepo) undeleteMemo(ctx context.Context, id domain.MemoID) error {
	db := r.db.Conn(ctx)

	numRows, err := queries.SetMemoDeletionStatus(ctx, r.db.Conn(ctx), sqlc.SetMemoDeletionStatusParams{ID: id, IsDeleted: false})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			err = domain.ErrMemoNotFound
		}

		return fmt.Errorf("error undeleting Memo (%d): %w", id, err)
	}

	if numRows == 0 {
		return domain.ErrMemoNotFound
	}

	memo, err := r.GetMemo(ctx, id)
	if err != nil {
		return fmt.Errorf("error undeleting Memo (%d): %w", id, err)
	}

	err = r.updateTags(ctx, db, memo)
	if err != nil {
		return fmt.Errorf("error undeleting Memo (%d): %w", id, err)
	}

	return nil
}

func (r *MemoRepo) CleanupDeletedMemos(ctx context.Context) (int64, error) {
	return queries.CleanupDeletedMemos(ctx, r.db.Conn(ctx))
}

type ListTagsQuery struct {
	PageSize  uint64
	PageAfter *string
}

func (r *MemoRepo) ListTags(ctx context.Context, query ListTagsQuery) (*domain.TagList, error) {
	params := sqlc.ListTagsParams{
		PageSize: int64(query.PageSize),
	}

	if query.PageAfter != nil {
		params.PageAfter = *query.PageAfter
	}

	res, err := queries.ListTags(ctx, r.db.Conn(ctx), params)
	if err != nil {
		return nil, err
	}

	list := &domain.TagList{
		Items: make([]*domain.Tag, len(res)),
		Next:  nil,
	}

	for i, tag := range res {
		list.Items[i] = &domain.Tag{
			Tag:       tag.Tag,
			Count:     tag.Count,
			UpdatedAt: tag.UpdatedAt.Time,
		}
	}

	if len(res) != 0 {
		next := fmt.Sprint(res[len(res)-1].ID)
		list.Next = &next
	}

	return list, nil
}

func (r *MemoRepo) updateTags(ctx context.Context, db sqlc.DBTX, memo *domain.Memo) error {
	tags := extractTags(memo.Content)

	deletedTags, err := queries.CleanupeMemoTagConnection(ctx, db, sqlc.CleanupeMemoTagConnectionParams{MemoID: int64(memo.ID), Tags: tags})
	if err != nil {
		return err
	}

	for _, tag := range tags {
		err = queries.CreateTag(ctx, db, sqlc.CreateTagParams{Tag: tag, CreatedBy: int64(memo.CreatedBy)})
		if err != nil {
			return err
		}

		err = queries.CreateMemoTagConnection(ctx, db, sqlc.CreateMemoTagConnectionParams{
			MemoID: int64(memo.ID),
			Tag:    tag,
		})
		if err != nil {
			return err
		}
	}

	err = queries.UpdateTagCount(ctx, db, append(deletedTags, tags...))
	if err != nil {
		return fmt.Errorf("error updating tag count: %w", err)
	}

	err = r.cleanupTagsWithNoCount(ctx, db)
	if err != nil {
		return err
	}

	return nil
}

func (r *MemoRepo) cleanupTagsWithNoCount(ctx context.Context, db sqlc.DBTX) error {
	err := queries.CleanupTagsWithNoCount(ctx, db)
	if err != nil {
		return fmt.Errorf("error cleaning up tags with 0 count: %w", err)
	}

	return nil
}

var tagPattern = regexp.MustCompile(`#([\w/\-_]+)`)
var codeBlockPattern = regexp.MustCompile("```[\\w]*")

func extractTags(content []byte) []string {
	var tags []string //nolint: prealloc // false positive
	nonCodeBlocks := codeBlockPattern.FindAllIndex(content, -1)

	if len(nonCodeBlocks) == 0 {
		foundTags := tagPattern.FindAllSubmatch(content, -1)
		for _, tag := range foundTags {
			tags = append(tags, string(tag[1]))
		}

		return tags
	}

	start := 0
	end := 0
	for i, f := range nonCodeBlocks {
		if i%2 == 0 {
			end = f[0]
			foundTags := tagPattern.FindAllSubmatch(content[start:end], -1)
			for _, tag := range foundTags {
				tags = append(tags, string(tag[1]))
			}
			start = f[1]
		}
	}

	foundTags := tagPattern.FindAllSubmatch(content[nonCodeBlocks[len(nonCodeBlocks)-1][1]:], -1)
	for _, tag := range foundTags {
		tags = append(tags, string(tag[1]))
	}

	return tags
}
