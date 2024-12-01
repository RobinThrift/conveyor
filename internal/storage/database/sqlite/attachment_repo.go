package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/RobinThrift/belt/internal/domain"
	"github.com/RobinThrift/belt/internal/storage/database"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite/sqlc"
	"github.com/mattn/go-sqlite3"
)

type AttachmentRepo struct {
	db database.Database
}

func NewAttachmentRepo(db database.Database) *AttachmentRepo {
	return &AttachmentRepo{db}
}

func (r *AttachmentRepo) GetAttachment(ctx context.Context, id domain.AttachmentID) (*domain.Attachment, error) {
	res, err := queries.GetAttachment(ctx, r.db.Conn(ctx), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrAttachmentNotFound
		}
		return nil, err
	}

	return &domain.Attachment{
		ID:               res.ID,
		OriginalFilename: res.OriginalFilename,
		Filepath:         res.Filepath,
		ContentType:      res.ContentType,
		SizeBytes:        res.SizeBytes,
		Sha256:           res.Sha256,
		CreatedBy:        res.CreatedBy,
		CreatedAt:        res.CreatedAt.Time,
	}, nil
}

func (r *AttachmentRepo) GetAttachmentByFilepath(ctx context.Context, filepath string) (*domain.Attachment, error) {
	res, err := queries.GetAttachmentByFilepath(ctx, r.db.Conn(ctx), filepath)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrAttachmentNotFound
		}
		return nil, err
	}

	return &domain.Attachment{
		ID:               res.ID,
		OriginalFilename: res.OriginalFilename,
		Filepath:         res.Filepath,
		ContentType:      res.ContentType,
		SizeBytes:        res.SizeBytes,
		Sha256:           res.Sha256,
		CreatedBy:        res.CreatedBy,
		CreatedAt:        res.CreatedAt.Time,
	}, nil
}

func (r *AttachmentRepo) CountAttachments(ctx context.Context) (int64, error) {
	return queries.CountAttachments(ctx, r.db.Conn(ctx))
}

type ListAttachmentsQuery struct {
	PageSize  uint64
	PageAfter *string
}

func (r *AttachmentRepo) ListAttachments(ctx context.Context, query ListAttachmentsQuery) (*domain.AttachmentList, error) {
	params := sqlc.ListAttachmentsParams{
		PageSize: int64(query.PageSize),
	}

	if query.PageAfter != nil {
		params.PageAfter = *query.PageAfter
	}

	res, err := queries.ListAttachments(ctx, r.db.Conn(ctx), params)
	if err != nil {
		return nil, err
	}

	list := &domain.AttachmentList{
		Items: make([]*domain.Attachment, 0, len(res)),
		Next:  nil,
	}

	for _, a := range res {
		list.Items = append(list.Items, &domain.Attachment{
			ID:               a.ID,
			OriginalFilename: a.OriginalFilename,
			Filepath:         a.Filepath,
			ContentType:      a.ContentType,
			SizeBytes:        a.SizeBytes,
			Sha256:           a.Sha256,
			CreatedBy:        a.CreatedBy,
			CreatedAt:        a.CreatedAt.Time,
		})
	}

	if len(res) != 0 {
		list.Next = &res[len(res)-1].OriginalFilename
	}

	return list, nil
}

func (r *AttachmentRepo) CreateAttachment(ctx context.Context, attachment *domain.Attachment) (domain.AttachmentID, error) {
	id, err := queries.CreateAttachment(ctx, r.db.Conn(ctx), sqlc.CreateAttachmentParams{
		OriginalFilename: attachment.OriginalFilename,
		Filepath:         attachment.Filepath,
		ContentType:      attachment.ContentType,
		SizeBytes:        attachment.SizeBytes,
		Sha256:           attachment.Sha256,
		CreatedBy:        attachment.CreatedBy,
	})
	if err != nil {
		if errors.Is(err, sqlite3.ErrConstraintForeignKey) {
			return domain.AttachmentID(-1), fmt.Errorf("invalid account reference")
		}
		return domain.AttachmentID(-1), err
	}

	return id, nil
}

func (r *AttachmentRepo) ListAttachmentsForMemo(ctx context.Context, memoID domain.MemoID) ([]*domain.Attachment, error) {
	res, err := queries.ListAttachmentsForMemo(ctx, r.db.Conn(ctx), int64(memoID))
	if err != nil {
		return nil, err
	}

	attachments := make([]*domain.Attachment, 0, len(res))

	for _, a := range res {
		attachments = append(attachments, &domain.Attachment{
			ID:               a.ID,
			OriginalFilename: a.OriginalFilename,
			Filepath:         a.Filepath,
			ContentType:      a.ContentType,
			SizeBytes:        a.SizeBytes,
			Sha256:           a.Sha256,
			CreatedBy:        a.CreatedBy,
			CreatedAt:        a.CreatedAt.Time,
		})
	}

	return attachments, nil
}

func (r *AttachmentRepo) CreateMemoAttachmentLink(ctx context.Context, memoID domain.MemoID, filepath string) error {
	attachment, err := r.GetAttachmentByFilepath(ctx, filepath)
	if err != nil {
		return err
	}

	err = queries.CreateMemoAttachmentLink(ctx, r.db.Conn(ctx), sqlc.CreateMemoAttachmentLinkParams{
		MemoID:       int64(memoID),
		AttachmentID: int64(attachment.ID),
	})
	if err != nil {
		if errors.Is(err, sqlite3.ErrConstraintForeignKey) {
			return domain.ErrMemoNotFound
		}
		return err
	}

	return nil
}

func (r *AttachmentRepo) DeleteMemoAttachmentLinks(ctx context.Context, memoID domain.MemoID, attachmentIDs []domain.AttachmentID) error {
	ids := make([]int64, len(attachmentIDs))
	for _, id := range attachmentIDs {
		ids = append(ids, int64(id))
	}

	err := queries.DeleteMemoAttachmentLinks(ctx, r.db.Conn(ctx), sqlc.DeleteMemoAttachmentLinksParams{
		MemoID:        int64(memoID),
		AttachmentIds: ids,
	})
	if err != nil {
		return err
	}

	return nil
}

func (r *AttachmentRepo) DeleteAttachments(ctx context.Context, ids []domain.AttachmentID) error {
	_, err := queries.DeleteAttachments(ctx, r.db.Conn(ctx), ids)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil
		}
		return err
	}

	return nil
}

func (r *AttachmentRepo) ListUnusedAttachments(ctx context.Context) ([]*domain.Attachment, error) {
	res, err := queries.ListUnusedAttachments(ctx, r.db.Conn(ctx))
	if err != nil {
		return nil, err
	}

	attachments := make([]*domain.Attachment, 0, len(res))

	for _, a := range res {
		attachments = append(attachments, &domain.Attachment{
			ID:               a.ID,
			OriginalFilename: a.OriginalFilename,
			Filepath:         a.Filepath,
			ContentType:      a.ContentType,
			SizeBytes:        a.SizeBytes,
			Sha256:           a.Sha256,
			CreatedBy:        a.CreatedBy,
			CreatedAt:        a.CreatedAt.Time,
		})
	}

	return attachments, nil
}
