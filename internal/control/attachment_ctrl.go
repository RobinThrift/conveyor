package control

import (
	"context"
	"io"
	"mime"
	"path"
	"time"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/domain"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite"
)

type AttachmentControl struct {
	fs             AttachmentControlFilesystem
	attachmentRepo AttachmentControlAttachmentRepo
}

type AttachmentControlFilesystem interface {
	WriteAttachment(context.Context, *domain.Attachment, io.Reader) error
	RemoveAttachment(context.Context, *domain.Attachment) error
}

type AttachmentControlAttachmentRepo interface {
	GetAttachment(ctx context.Context, id domain.AttachmentID) (*domain.Attachment, error)
	ListAttachments(ctx context.Context, query sqlite.ListAttachmentsQuery) (*domain.AttachmentList, error)
	CreateAttachment(ctx context.Context, attachment *domain.Attachment) (domain.AttachmentID, error)
	DeleteAttachments(ctx context.Context, ids []domain.AttachmentID) error
}

func NewAttachmentControl(fs AttachmentControlFilesystem, attachmentRepo AttachmentControlAttachmentRepo) *AttachmentControl {
	return &AttachmentControl{fs, attachmentRepo}
}

func (ac *AttachmentControl) GetAttachment(ctx context.Context, id domain.AttachmentID) (*domain.Attachment, error) {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return nil, auth.ErrUnauthorized
	}

	return ac.attachmentRepo.GetAttachment(ctx, id)
}

type ListAttachmentsQuery struct {
	PageSize  uint64
	PageAfter *string
}

func (ac *AttachmentControl) ListAttachments(ctx context.Context, query ListAttachmentsQuery) (*domain.AttachmentList, error) {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return nil, auth.ErrUnauthorized
	}

	return ac.attachmentRepo.ListAttachments(ctx, sqlite.ListAttachmentsQuery{
		PageSize:  query.PageSize,
		PageAfter: query.PageAfter,
	})
}

type CreateAttachmentCmd struct {
	Filename string
	Content  io.Reader
}

func (ac *AttachmentControl) CreateAttachment(ctx context.Context, cmd CreateAttachmentCmd) (domain.AttachmentID, error) {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return domain.AttachmentID(-1), auth.ErrUnauthorized
	}

	attachment := &domain.Attachment{
		OriginalFilename: cmd.Filename,
		ContentType:      mime.TypeByExtension(path.Ext(cmd.Filename)),
		CreatedBy:        account.ID,
		CreatedAt:        time.Now(),
	}

	err := ac.fs.WriteAttachment(ctx, attachment, cmd.Content)
	if err != nil {
		return domain.AttachmentID(-1), err
	}

	id, err := ac.attachmentRepo.CreateAttachment(ctx, attachment)
	if err != nil {
		return domain.AttachmentID(-1), err
	}

	return id, nil
}
