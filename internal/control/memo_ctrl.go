package control

import (
	"context"
	"time"

	"github.com/RobinThrift/belt/internal/domain"
	"github.com/RobinThrift/belt/internal/storage/database"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite"
)

type MemoControl struct {
	transactioner database.Transactioner
	memoRepo      MemoControlMemoRepo
}

type MemoControlMemoRepo interface {
	ListMemos(ctx context.Context, query sqlite.ListMemosQuery) (*domain.MemoList, error)
}

func NewMemoControl(transactioner database.Transactioner, memoRepo MemoControlMemoRepo) *MemoControl {
	return &MemoControl{transactioner: transactioner, memoRepo: memoRepo}
}

type ListMemosQuery struct {
	PageSize uint64
	After    *domain.MemoID

	Search          *string
	Tag             *domain.Tag
	CreatedAt       *time.Time
	MinCreationDate *time.Time
	IsArchived      *bool
}

func (mc *MemoControl) ListMemos(ctx context.Context, query ListMemosQuery) (*domain.MemoList, error) {
	return nil, nil
}
