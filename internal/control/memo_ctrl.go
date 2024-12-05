package control

import (
	"context"
	"fmt"
	"regexp"
	"time"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/domain"
	"github.com/RobinThrift/belt/internal/storage/database"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite"
	"github.com/RobinThrift/belt/internal/x/stringset"
)

type MemoControl struct {
	transactioner  database.Transactioner
	memoRepo       MemoControlMemoRepo
	attachmentRepo MemoControlAttachmentRepo
}

type MemoControlMemoRepo interface {
	GetMemo(ctx context.Context, id domain.MemoID) (*domain.Memo, error)
	ListMemos(ctx context.Context, query domain.ListMemosQuery) (*domain.MemoList, error)
	CreateMemo(ctx context.Context, memo *domain.Memo) (domain.MemoID, error)
	UpdateMemoContent(ctx context.Context, memo *domain.Memo) error
	UpdateArchiveStatus(ctx context.Context, id domain.MemoID, isArchived bool) error
	DeleteMemo(ctx context.Context, id domain.MemoID) error
	UndeleteMemo(ctx context.Context, id domain.MemoID) error
	ListTags(ctx context.Context, query sqlite.ListTagsQuery) (*domain.TagList, error)
}

type MemoControlAttachmentRepo interface {
	CreateMemoAttachmentLink(ctx context.Context, memoID domain.MemoID, filepath string) error
	DeleteMemoAttachmentLinks(ctx context.Context, memoID domain.MemoID, attachmentIDs []domain.AttachmentID) error
	ListAttachmentsForMemo(ctx context.Context, memoID domain.MemoID) ([]*domain.Attachment, error)
}

func NewMemoControl(transactioner database.Transactioner, memoRepo MemoControlMemoRepo, attachmentRepo MemoControlAttachmentRepo) *MemoControl {
	return &MemoControl{transactioner, memoRepo, attachmentRepo}
}

func (mc *MemoControl) GetMemo(ctx context.Context, id domain.MemoID) (*domain.Memo, error) {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return nil, auth.ErrUnauthorized
	}

	return mc.memoRepo.GetMemo(ctx, id)
}

type ListMemosQuery domain.ListMemosQuery

func (mc *MemoControl) ListMemos(ctx context.Context, query ListMemosQuery) (*domain.MemoList, error) {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return nil, auth.ErrUnauthorized
	}

	return mc.memoRepo.ListMemos(ctx, domain.ListMemosQuery(query))
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
		CreatedAt: time.Now(),
	}

	if cmd.CreatedAt != nil {
		memo.CreatedAt = cmd.CreatedAt.UTC()
	}

	id, err := mc.memoRepo.CreateMemo(ctx, memo)
	if err != nil {
		return domain.MemoID(-1), fmt.Errorf("%w: %v", domain.ErrCreateMemo, err)
	}

	err = mc.updateAttachments(ctx, id, cmd.Content)
	if err != nil {
		return domain.MemoID(-1), fmt.Errorf("%w: %v", domain.ErrCreateMemo, err)
	}

	return id, nil
}

type UpdateMemoCmd struct {
	MemoID     domain.MemoID
	IsArchived *bool
	IsDeleted  *bool
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

		err = mc.updateAttachments(ctx, cmd.MemoID, cmd.Content)
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

	if cmd.IsDeleted != nil && *cmd.IsDeleted {
		err = mc.memoRepo.DeleteMemo(ctx, cmd.MemoID)
		if err != nil {
			return fmt.Errorf("error deleting memo %d: %v", cmd.MemoID, err)
		}
	} else if cmd.IsDeleted != nil && !*cmd.IsDeleted {
		err = mc.memoRepo.UndeleteMemo(ctx, cmd.MemoID)
		if err != nil {
			return fmt.Errorf("error restoring memo %d: %v", cmd.MemoID, err)
		}
	}

	return nil
}

func (mc *MemoControl) updateAttachments(ctx context.Context, memoID domain.MemoID, content []byte) error {
	attachmentURLs := stringset.New(extractAssetURLs(content)...)

	existingAttachments, err := mc.attachmentRepo.ListAttachmentsForMemo(ctx, memoID)
	if err != nil {
		return fmt.Errorf("error getting attachments for memo: %w", err)
	}

	removed := make([]domain.AttachmentID, 0, len(attachmentURLs))
	for _, attachment := range existingAttachments {
		if !attachmentURLs.Has(attachment.Filepath) {
			removed = append(removed, attachment.ID)
		} else {
			attachmentURLs.Del(attachment.Filepath)
		}
	}

	if len(removed) != 0 {
		err = mc.attachmentRepo.DeleteMemoAttachmentLinks(ctx, memoID, removed)
		if err != nil {
			return err
		}
	}

	for _, url := range attachmentURLs.Values() {
		err = mc.attachmentRepo.CreateMemoAttachmentLink(ctx, memoID, url)
		if err != nil {
			return err
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

var attachmentsURLPattern = regexp.MustCompile(`\[.*\]\(.*/attachments/(([a-fA-F0-9]{2}/)+.+?)\)`)

func extractAssetURLs(content []byte) []string {
	matches := attachmentsURLPattern.FindAllSubmatch(content, -1)
	assetURLs := make([]string, 0, len(matches))

	for _, match := range matches {
		assetURLs = append(assetURLs, "/"+string(match[1]))
	}

	return assetURLs
}
