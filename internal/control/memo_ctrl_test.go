package control

import (
	"context"
	"testing"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite"
	"github.com/RobinThrift/belt/internal/testhelper"
	"github.com/stretchr/testify/assert"
)

func TestMemoCtrl(t *testing.T) {
	memoCtrl := setupMemoControl(context.Background(), t)
	assert.NotNil(t, memoCtrl)
}

func Test_extractAssetURLs(t *testing.T) {
	content := []byte(`![filename_a.ext](/baseURL/attachments/ab/cd/ef/12/34/filename_a.ext)
![filename_b.ext](/baseURL/attachments/34/12/ef/cd/ab/filename_b.ext)`)

	assetURLs := extractAssetURLs(content)

	assert.Equal(t, []string{
		"/ab/cd/ef/12/34/filename_a.ext",
		"/34/12/ef/cd/ab/filename_b.ext",
	}, assetURLs)
}

func setupMemoControl(ctx context.Context, t *testing.T) *MemoControl {
	db := testhelper.NewInMemTestSQLite(ctx, t)

	accountRepo := sqlite.NewAccountRepo(db)
	memoRepo := sqlite.NewMemoRepo(db)
	attachmentRepo := sqlite.NewAttachmentRepo(db)

	err := accountRepo.Create(ctx, &auth.Account{Username: t.Name(), DisplayName: t.Name(), IsAdmin: true})
	if err != nil {
		t.Fatal(err)
	}

	return NewMemoControl(db, memoRepo, attachmentRepo)
}
