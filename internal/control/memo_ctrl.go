package control

import (
	"context"
	"fmt"
	"time"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/domain"
	"github.com/RobinThrift/belt/internal/storage/database"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite"
)

type MemoControl struct {
	transactioner database.Transactioner
	memoRepo      MemoControlMemoRepo
}

type MemoControlMemoRepo interface {
	GetMemo(ctx context.Context, id domain.MemoID) (*domain.Memo, error)
	ListMemos(ctx context.Context, query sqlite.ListMemosQuery) (*domain.MemoList, error)
	CreateMemo(ctx context.Context, memo *domain.Memo) (domain.MemoID, error)
	UpdateMemoContent(ctx context.Context, memo *domain.Memo) error
	UpdateArchiveStatus(ctx context.Context, id domain.MemoID, isArchived bool) error
	DeleteMemo(ctx context.Context, id domain.MemoID) error
	UndeleteMemo(ctx context.Context, id domain.MemoID) error
	ListTags(ctx context.Context, query sqlite.ListTagsQuery) (*domain.TagList, error)
}

func NewMemoControl(transactioner database.Transactioner, memoRepo MemoControlMemoRepo) *MemoControl {
	return &MemoControl{transactioner: transactioner, memoRepo: memoRepo}
}

func (mc *MemoControl) GetMemo(ctx context.Context, id domain.MemoID) (*domain.Memo, error) {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return nil, auth.ErrUnauthorized
	}

	return mc.memoRepo.GetMemo(ctx, id)
}

type ListMemosQuery struct {
	PageSize  uint64
	PageAfter *time.Time

	Tag             *string
	Search          *string
	CreatedAt       *time.Time
	MinCreationDate *time.Time
}

func (mc *MemoControl) ListMemos(ctx context.Context, query ListMemosQuery) (*domain.MemoList, error) {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return nil, auth.ErrUnauthorized
	}

	return mc.memoRepo.ListMemos(ctx, sqlite.ListMemosQuery{
		PageSize:        query.PageSize,
		PageAfter:       query.PageAfter,
		Tag:             query.Tag,
		Search:          query.Search,
		CreatedAt:       query.CreatedAt,
		MinCreationDate: query.MinCreationDate,
	})
}

type CreateMemoCmd struct {
	Content   []byte
	CreatedAt *time.Time
}

func (mc *MemoControl) CreateMemo(ctx context.Context, cmd CreateMemoCmd) (domain.MemoID, error) {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return domain.MemoID(-1), auth.ErrUnauthorized
	}

	memo := &domain.Memo{
		CreatedBy: account.ID,
		Content:   cmd.Content,
	}

	if cmd.CreatedAt != nil {
		memo.CreatedAt = cmd.CreatedAt.UTC()
	}

	id, err := mc.memoRepo.CreateMemo(ctx, memo)
	if err != nil {
		return domain.MemoID(-1), fmt.Errorf("%w: %v", domain.ErrCreateMemo, err)
	}

	return id, nil
}

type UpdateMemoCmd struct {
	MemoID     domain.MemoID
	IsArchived *bool
	Content    []byte
}

func (mc *MemoControl) UpdateMemo(ctx context.Context, cmd UpdateMemoCmd) error {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return auth.ErrUnauthorized
	}

	memo, err := mc.memoRepo.GetMemo(ctx, cmd.MemoID)
	if err != nil {
		return err
	}

	if cmd.Content != nil {
		memo.Content = cmd.Content

		err = mc.memoRepo.UpdateMemoContent(ctx, memo)
		if err != nil {
			return fmt.Errorf("error updating memo %d: %v", cmd.MemoID, err)
		}
	}

	if cmd.IsArchived != nil {
		err = mc.memoRepo.UpdateArchiveStatus(ctx, cmd.MemoID, *cmd.IsArchived)
		if err != nil {
			return fmt.Errorf("error updating memo %d: %v", cmd.MemoID, err)
		}
	}

	return nil
}

type ListTagsQuery struct {
	PageSize  uint64
	PageAfter *string

	Tag             *string
	Search          *string
	CreatedAt       *time.Time
	MinCreationDate *time.Time
}

func (mc *MemoControl) ListTags(ctx context.Context, query ListTagsQuery) (*domain.TagList, error) {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return nil, auth.ErrUnauthorized
	}

	return mc.memoRepo.ListTags(ctx, sqlite.ListTagsQuery{
		PageSize:  query.PageSize,
		PageAfter: query.PageAfter,
	})
}
