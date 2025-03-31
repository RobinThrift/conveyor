package control

import (
	"context"
	"io"

	"go.robinthrift.com/conveyor/internal/auth"
	"go.robinthrift.com/conveyor/internal/domain"
	"go.robinthrift.com/conveyor/internal/storage"
)

type AttachmentController struct {
	blobs AttachmentControllerBlobStorage
}

type AttachmentControllerBlobStorage interface {
	WriteBlob(accountID domain.AccountID, filepath string, content io.Reader) (int64, error)
	OpenBlobTarget(accountID domain.AccountID, originalFilename string) (storage.BlobTarget, error)
	RemoveBlob(accountID domain.AccountID, filepath string) error
}

func NewAttachmentController(blobStorage AttachmentControllerBlobStorage) *AttachmentController {
	return &AttachmentController{blobStorage}
}

type StoreAttachmentCmd struct {
	Filepath string
	Content  io.Reader
}

func (ac *AttachmentController) StoreAttachment(ctx context.Context, cmd StoreAttachmentCmd) error {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return auth.ErrUnauthorized
	}

	_, err := ac.blobs.WriteBlob(account.ID, cmd.Filepath, cmd.Content)
	if err != nil {
		return err
	}

	return nil
}

func (ac *AttachmentController) OpenBlobTarget(ctx context.Context, originalFilename string) (storage.BlobTarget, error) {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return nil, auth.ErrUnauthorized
	}

	return ac.blobs.OpenBlobTarget(account.ID, originalFilename)
}
