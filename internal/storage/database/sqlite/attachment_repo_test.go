package sqlite

import (
	"context"
	"crypto/sha256"
	"fmt"
	"testing"
	"time"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/domain"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite/sqlc"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite/types"
	"github.com/stretchr/testify/require"
)

func Test_AttachmentRepo_CRUD(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	repo := setupAttachmentRepo(ctx, t)

	numAttachments := 100
	now := time.Date(2024, 03, 15, 12, 0, 0, 0, time.UTC)

	// Create new Attachments
	for i := 0; i < numAttachments; i++ {
		filename := fmt.Sprintf("file-%d.txt", i)
		hash := sha256.New().Sum([]byte(filename))
		_, err := repo.CreateAttachment(ctx, &domain.Attachment{
			OriginalFilename: filename,
			Filepath:         "a/b/c/" + filename,
			ContentType:      "plain/text",
			SizeBytes:        int64(len(filename)),
			Sha256:           hash,
			CreatedBy:        auth.AccountID(1),
			CreatedAt:        now.Add(-time.Hour * time.Duration(i)),
		})
		require.NoError(t, err)
	}

	count, err := repo.CountAttachments(ctx)
	require.NoError(t, err)
	require.Equal(t, int64(numAttachments), count)

	var pageAfter *string = nil
	lastFilename := ""
	pageSize := 25
	// List all Attachments in batches of 25
	for i := 0; i < numAttachments; i += pageSize {
		q := ListAttachmentsQuery{
			PageSize:  uint64(pageSize),
			PageAfter: pageAfter,
		}

		list, err := repo.ListAttachments(ctx, q)
		require.NoError(t, err, i)

		require.Lenf(t, list.Items, pageSize, "i = %d", i)
		require.NotEqualf(t, lastFilename, list.Items[0].OriginalFilename, "i = %d", i)
		lastFilename = list.Items[len(list.Items)-1].OriginalFilename
		pageAfter = list.Next
	}

	t.Run("Get Attachment", func(t *testing.T) {
		a, err := repo.GetAttachment(ctx, domain.AttachmentID(1))
		require.NoError(t, err)
		require.NotNil(t, a)
	})

	t.Run("Delete Attachment", func(t *testing.T) {
		err := repo.DeleteAttachments(ctx, []domain.AttachmentID{4, 5})
		require.NoError(t, err)

		a, err := repo.GetAttachment(ctx, 4)
		require.ErrorIs(t, err, domain.ErrAttachmentNotFound)
		require.Nil(t, a)

		a, err = repo.GetAttachment(ctx, 5)
		require.ErrorIs(t, err, domain.ErrAttachmentNotFound)
		require.Nil(t, a)
	})

	t.Run("Memo Attachment Links", func(t *testing.T) {
		id, err := queries.CreateMemo(ctx, repo.db.Conn(ctx), sqlc.CreateMemoParams{
			Content:   []byte("memo content"),
			CreatedBy: auth.AccountID(1),
			CreatedAt: types.NewSQLiteDatetime(now),
		})
		require.NoError(t, err)

		err = repo.CreateMemoAttachmentLink(ctx, id, "a/b/c/file-10.txt")
		require.NoError(t, err)

		err = repo.DeleteMemoAttachmentLinks(ctx, id, []domain.AttachmentID{10})
		require.NoError(t, err)
	})
}

func Test_AttachmentRepo_CleanupUnused(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	repo := setupAttachmentRepo(ctx, t)

	numAttachments := 100
	now := time.Date(2024, 03, 15, 12, 0, 0, 0, time.UTC)

	// Create new Attachments
	for i := 0; i < numAttachments; i++ {
		filename := fmt.Sprintf("file-%d.txt", i)
		hash := sha256.New().Sum([]byte(filename))
		_, err := repo.CreateAttachment(ctx, &domain.Attachment{
			OriginalFilename: filename,
			Filepath:         "a/b/c/" + filename,
			ContentType:      "plain/text",
			SizeBytes:        int64(len(filename)),
			Sha256:           hash,
			CreatedBy:        auth.AccountID(1),
			CreatedAt:        now.Add(-time.Hour * time.Duration(i)),
		})
		require.NoError(t, err)

		if i%2 == 0 {
			id, err := queries.CreateMemo(ctx, repo.db.Conn(ctx), sqlc.CreateMemoParams{
				Content:   []byte("memo content for attachment " + filename),
				CreatedBy: auth.AccountID(1),
				CreatedAt: types.NewSQLiteDatetime(now),
			})
			require.NoError(t, err)

			err = repo.CreateMemoAttachmentLink(ctx, id, "a/b/c/"+filename)
			require.NoError(t, err)
		}
	}

	count, err := repo.CountAttachments(ctx)
	require.NoError(t, err)
	require.Equal(t, int64(numAttachments), count)

	unused, err := repo.ListUnusedAttachments(ctx)
	require.NoError(t, err)
	require.Len(t, unused, numAttachments/2)
}

func setupAttachmentRepo(ctx context.Context, t *testing.T) *AttachmentRepo {
	t.Helper()
	db := newTestDB(ctx, t)

	accountRepo := NewAccountRepo(db)

	err := accountRepo.Create(ctx, &auth.Account{Username: "user", DisplayName: "user", IsAdmin: true})
	if err != nil {
		t.Fatal(err)
	}

	return NewAttachmentRepo(db)
}
