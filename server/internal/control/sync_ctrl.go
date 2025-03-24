package control

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"path"
	"time"

	"go.robinthrift.com/belt/internal/auth"
	"go.robinthrift.com/belt/internal/domain"
	"go.robinthrift.com/belt/internal/storage"
	"go.robinthrift.com/belt/internal/storage/database"

	"filippo.io/age"
	gonanoid "github.com/matoous/go-nanoid/v2"
)

type SyncController struct {
	transactioner database.Transactioner
	syncRepo      SyncControllerSyncRepo
	attachments   *AttachmentController
	accountCtrl   *AccountControl
	blobs         SyncControllerBlobStorage
}

type SyncControllerBlobStorage interface {
	WriteBlob(accountID domain.AccountID, filepath string, content io.Reader) (int64, error)
	RemoveBlob(accountID domain.AccountID, filepath string) error
}

type SyncControllerSyncRepo interface {
	CreateSyncClient(ctx context.Context, client *domain.SyncClient) error
	DeleteSyncClient(ctx context.Context, client *domain.SyncClient) error
	ListChangelogEntries(ctx context.Context, query domain.ListChangelogEntriesQuery) ([]domain.ChangelogEntry, error)
	CreateChangelogEntries(ctx context.Context, entries []domain.ChangelogEntry) error
	CreateFullSyncEntry(ctx context.Context, entry *domain.FullSyncEntry) error
	GetLatestFullSyncEntry(ctx context.Context, accountID domain.AccountID) (*domain.FullSyncEntry, error)
}

func NewSyncController(transactioner database.Transactioner, syncRepo SyncControllerSyncRepo, accountCtrl *AccountControl, attachments *AttachmentController, blobs SyncControllerBlobStorage) *SyncController {
	return &SyncController{transactioner, syncRepo, attachments, accountCtrl, blobs}
}

type RegisterClientCmd struct {
	ClientID domain.SyncClientID
}

func (sc *SyncController) RegisterClient(ctx context.Context, cmd RegisterClientCmd) error {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return auth.ErrUnauthorized
	}

	return sc.syncRepo.CreateSyncClient(ctx, &domain.SyncClient{
		ID:        cmd.ClientID,
		AccountID: account.ID,
	})
}

type UnregisterClientCmd struct {
	ClientID domain.SyncClientID
}

func (sc *SyncController) UnregisterClient(ctx context.Context, cmd UnregisterClientCmd) error {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return auth.ErrUnauthorized
	}

	return sc.syncRepo.DeleteSyncClient(ctx, &domain.SyncClient{
		ID:        cmd.ClientID,
		AccountID: account.ID,
	})
}

func (sc *SyncController) GetLatestFullSyncEntry(ctx context.Context) (*domain.FullSyncEntry, error) {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return nil, auth.ErrUnauthorized
	}

	entry, err := sc.syncRepo.GetLatestFullSyncEntry(ctx, account.ID)
	if err != nil {
		return nil, err
	}

	entry.Filepath = path.Join("dbs", fmt.Sprintf("belt_%d.db", entry.Timestamp.Unix()))

	return entry, nil
}

type SaveFullDBCmd struct {
	Data io.Reader
}

func (sc *SyncController) SaveFullDB(ctx context.Context, cmd SaveFullDBCmd) error {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return auth.ErrUnauthorized
	}

	return sc.transactioner.InTransaction(ctx, func(ctx context.Context) error {
		timestamp := time.Now()
		filepath := path.Join("dbs", fmt.Sprintf("belt_%d.db", timestamp.Unix()))

		h := sha256.New()

		tee := io.TeeReader(cmd.Data, h)

		sizeBytes, err := sc.blobs.WriteBlob(account.ID, filepath, tee)
		if err != nil {
			return err
		}

		return sc.syncRepo.CreateFullSyncEntry(ctx, &domain.FullSyncEntry{
			AccountID:  account.ID,
			Timestamp:  timestamp,
			Filepath:   filepath,
			SizeBytes:  sizeBytes,
			Sha256Hash: h.Sum(nil),
		})
	})

}

type ListChangelogEntriesQuery struct {
	Since time.Time
}

func (sc *SyncController) ListChangelogEntries(ctx context.Context, query ListChangelogEntriesQuery) ([]domain.ChangelogEntry, error) {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return nil, auth.ErrUnauthorized
	}

	return sc.syncRepo.ListChangelogEntries(ctx, domain.ListChangelogEntriesQuery{
		AccountID: account.ID,
		Since:     query.Since,
	})
}

type CreateChangelogEntriesCmd struct {
	Entries []domain.ChangelogEntry
}

func (sc *SyncController) CreateChangelogEntries(ctx context.Context, cmd CreateChangelogEntriesCmd) error {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return auth.ErrUnauthorized
	}

	for i := range cmd.Entries {
		cmd.Entries[i].AccountID = account.ID
	}

	return sc.transactioner.InTransaction(ctx, func(ctx context.Context) error {
		return sc.syncRepo.CreateChangelogEntries(ctx, cmd.Entries)
	})
}

func (sc *SyncController) StoreAttachment(ctx context.Context, cmd StoreAttachmentCmd) error {
	return sc.attachments.StoreAttachment(ctx, cmd)
}

type CreateMemoChangelogEntryCmd struct {
	Memo          *domain.ChangelogEntry
	PlaintextMemo *PlaintextMemo
}

type PlaintextMemo struct {
	Content   string
	CreatedAt *time.Time
}

func (sc *SyncController) CreateMemoChangelogEntry(ctx context.Context, cmd CreateMemoChangelogEntryCmd) error {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return auth.ErrUnauthorized
	}

	var memo domain.ChangelogEntry
	switch {
	case cmd.Memo != nil:
		memo = *cmd.Memo
	case cmd.PlaintextMemo != nil:
		entry, err := sc.newCreateMemoChangelogEntry(ctx, cmd.PlaintextMemo)
		if err != nil {
			return err
		}
		memo = *entry
	default:
		return fmt.Errorf("either Memo or PlaintextMemo MUST be set on CreateMemoCmd")
	}

	memo.AccountID = account.ID

	return sc.transactioner.InTransaction(ctx, func(ctx context.Context) error {
		return sc.syncRepo.CreateChangelogEntries(ctx, []domain.ChangelogEntry{memo})
	})
}

type CreateAttachmentChangelogEntryCmd struct {
	OriginalFilename string
	ContentType      string
	Data             io.Reader
	IsEncrytped      bool
	Filepath         string
	sizeBytes        int64
	sha256           []byte
	recipient        *age.X25519Recipient
}

func (sc *SyncController) CreateAttachmentChangelogEntry(ctx context.Context, cmd CreateAttachmentChangelogEntryCmd) (string, error) {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return "", auth.ErrUnauthorized
	}

	var id string
	err := sc.transactioner.InTransaction(ctx, func(ctx context.Context) (err error) {
		id, err = sc.createAttachmentChangelogEntry(ctx, &cmd)
		return err
	})
	if err != nil {
		return "", fmt.Errorf("error creating changelog entry: %w", err)
	}

	return id, nil
}

func (sc *SyncController) createAttachmentChangelogEntry(ctx context.Context, cmd *CreateAttachmentChangelogEntryCmd) (string, error) {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return "", auth.ErrUnauthorized
	}

	var id string

	key, err := sc.accountCtrl.GetAccountKeyByName(ctx, domain.PrimaryAccountKeyName)
	if err != nil {
		return id, fmt.Errorf("error getting account key: %w", err)
	}

	blob, err := sc.attachments.OpenBlobTarget(ctx, cmd.OriginalFilename)
	if err != nil {
		return id, fmt.Errorf("error opening blob target: %w", err)
	}
	defer func() {
		err = errors.Join(err, blob.Close())
	}()

	cmd.recipient, err = age.ParseX25519Recipient(string(key.Data))
	if err != nil {
		return id, fmt.Errorf("error parsing encryption key: %v", err)
	}

	if cmd.IsEncrytped {
		err = sc.writeEncryptedDataForAttachmentChangelogEntry(cmd, blob)
	} else {
		err = sc.writeUnencryptedDataForAttachmentChangelogEntry(cmd, blob)
	}

	if err != nil {
		return id, err
	}

	err = blob.Finalize(cmd.Filepath)
	if err != nil {
		return id, fmt.Errorf("error finalizing bytes: %w", err)
	}

	targetID, entry, err := sc.newCreateAttachmentChangelogEntry(cmd)
	if err != nil {
		return id, fmt.Errorf("error creating new changelog entry: %w", err)
	}

	entry.AccountID = account.ID

	id = targetID

	err = sc.syncRepo.CreateChangelogEntries(ctx, []domain.ChangelogEntry{*entry})
	if err != nil {
		return id, fmt.Errorf("error saving changelog entry to DB: %w", err)
	}

	return id, nil
}

func (sc *SyncController) writeUnencryptedDataForAttachmentChangelogEntry(cmd *CreateAttachmentChangelogEntryCmd, blob storage.BlobTarget) error {
	h := sha256.New()

	tee := io.TeeReader(cmd.Data, h)

	encrypterClosed := false
	encrypter, err := age.Encrypt(blob, cmd.recipient)
	if err != nil {
		return fmt.Errorf("error starting encrypter: %w", err)
	}
	defer func() {
		if !encrypterClosed {
			if closeErr := encrypter.Close(); closeErr != nil {
				err = errors.Join(err, fmt.Errorf("error closing encrypter: %w", closeErr))
			}
		}
	}()

	cmd.sizeBytes, err = io.Copy(encrypter, tee)
	if err != nil {
		return fmt.Errorf("error copying bytes: %w", err)
	}

	cmd.sha256 = h.Sum(nil)

	for _, b := range cmd.sha256 {
		cmd.Filepath = cmd.Filepath + "/" + fmt.Sprintf("%02x", b)
	}

	encrypterClosed = true
	err = encrypter.Close()
	if err != nil {
		return fmt.Errorf("error closing encrypter: %w", err)
	}

	return nil
}

func (sc *SyncController) writeEncryptedDataForAttachmentChangelogEntry(cmd *CreateAttachmentChangelogEntryCmd, blob storage.BlobTarget) (err error) {
	_, err = io.Copy(blob, cmd.Data)
	if err != nil {
		return fmt.Errorf("error copying bytes: %w", err)
	}

	return nil
}

func (sc *SyncController) newCreateMemoChangelogEntry(ctx context.Context, memo *PlaintextMemo) (*domain.ChangelogEntry, error) {
	key, err := sc.accountCtrl.GetAccountKeyByName(ctx, domain.PrimaryAccountKeyName)
	if err != nil {
		return nil, err
	}

	recipient, err := age.ParseX25519Recipient(string(key.Data))
	if err != nil {
		return nil, fmt.Errorf("error parsing encryption key: %v", err)
	}

	id, err := gonanoid.New()
	if err != nil {
		return nil, err
	}

	memoID, err := gonanoid.New()
	if err != nil {
		return nil, err
	}

	createdAt := time.Now()
	if memo.CreatedAt != nil {
		createdAt = *memo.CreatedAt
	}

	entry := createMemoChangelogEntry{
		ID:         id,
		Source:     "external",
		Revision:   1,
		TargetType: "memos",
		TargetID:   memoID,
		Timestamp:  createdAt,
		IsSynced:   false,
		IsApplied:  false,
	}
	entry.Value.Created.Content = memo.Content
	entry.Value.Created.CreatedAt = createdAt
	entry.Value.Created.UpdatedAt = createdAt

	var encrypted bytes.Buffer

	w, err := age.Encrypt(&encrypted, recipient)
	if err != nil {
		return nil, err
	}

	err = json.NewEncoder(w).Encode(entry)
	if err != nil {
		return nil, err
	}

	if err := w.Close(); err != nil {
		return nil, fmt.Errorf("error closing encrypted data: %v", err)
	}

	return &domain.ChangelogEntry{
		SyncClientID: "external",
		Data:         encrypted.Bytes(),
		Timestamp:    createdAt,
	}, nil
}

func (sc *SyncController) newCreateAttachmentChangelogEntry(cmd *CreateAttachmentChangelogEntryCmd) (string, *domain.ChangelogEntry, error) {
	id, err := gonanoid.New()
	if err != nil {
		return "", nil, err
	}

	attachmentID, err := gonanoid.New()
	if err != nil {
		return "", nil, err
	}

	entry := createAttachmentChangelogEntry{
		ID:         id,
		Source:     "external",
		Revision:   1,
		TargetType: "attachments",
		TargetID:   attachmentID,
		Timestamp:  time.Now(),
		IsSynced:   false,
		IsApplied:  false,
	}

	entry.Value.Created.Filepath = cmd.Filepath
	if entry.Value.Created.Filepath[0] != '/' {
		entry.Value.Created.Filepath = "/" + entry.Value.Created.Filepath
	}
	entry.Value.Created.OriginalFilename = cmd.OriginalFilename
	entry.Value.Created.ContentType = cmd.ContentType
	entry.Value.Created.SizeBytes = cmd.sizeBytes
	entry.Value.Created.Sha256 = hex.EncodeToString(cmd.sha256)

	var encrypted bytes.Buffer

	w, err := age.Encrypt(&encrypted, cmd.recipient)
	if err != nil {
		return "", nil, err
	}

	err = json.NewEncoder(w).Encode(entry)
	if err != nil {
		return "", nil, err
	}

	if err := w.Close(); err != nil {
		return "", nil, fmt.Errorf("error closing encrypted data: %v", err)
	}

	return attachmentID, &domain.ChangelogEntry{
		SyncClientID: "external",
		Data:         encrypted.Bytes(),
		Timestamp:    entry.Timestamp,
	}, nil
}

type createMemoChangelogEntry struct {
	ID         string `json:"id,omitempty"`
	Source     string `json:"source,omitempty"`
	Revision   int    `json:"revision,omitempty"`
	TargetType string `json:"targetType,omitempty"`
	TargetID   string `json:"targetID,omitempty"`
	Value      struct {
		Created struct {
			Content    string    `json:"content,omitempty"`
			IsArchived bool      `json:"isArchived,omitempty"`
			IsDeleted  bool      `json:"isDeleted,omitempty"`
			CreatedAt  time.Time `json:"createdAt"`
			UpdatedAt  time.Time `json:"updatedAt"`
		} `json:"created"`
	} `json:"value"`
	Timestamp time.Time `json:"timestamp"`
	IsSynced  bool      `json:"isSynced,omitempty"`
	IsApplied bool      `json:"isApplied,omitempty"`
}

type createAttachmentChangelogEntry struct {
	ID         string `json:"id,omitempty"`
	Source     string `json:"source,omitempty"`
	Revision   int    `json:"revision,omitempty"`
	TargetType string `json:"targetType,omitempty"`
	TargetID   string `json:"targetID,omitempty"`
	Value      struct {
		Created struct {
			Filepath         string `json:"filepath,omitempty"`
			OriginalFilename string `json:"originalFilename,omitempty"`
			ContentType      string `json:"contentType,omitempty"`
			SizeBytes        int64  `json:"sizeBytes,omitempty"`
			Sha256           string `json:"sha256,omitempty"`
		} `json:"created"`
	} `json:"value"`
	Timestamp time.Time `json:"timestamp"`
	IsSynced  bool      `json:"isSynced,omitempty"`
	IsApplied bool      `json:"isApplied,omitempty"`
}
