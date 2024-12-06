package control

import (
	"bytes"
	"context"
	"testing"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/domain"
	"github.com/RobinThrift/belt/internal/plugins"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite"
	"github.com/RobinThrift/belt/internal/testhelper"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMemoControl_Plugins_ChangeMemoContent(t *testing.T) {
	t.Parallel()
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	ctx = auth.CtxWithAccount(ctx, &auth.Account{ID: 1})

	ctrl := setupMemoControl(ctx, t, &testMemoPlugin{
		name: "Memos.ReplaceStringContent",
		memoContentPlugin: func(ctx context.Context, content []byte) ([]byte, error) {
			return bytes.ReplaceAll(content, []byte("replace_me"), []byte("New Content")), nil
		},
	})

	createdID, err := ctrl.CreateMemo(ctx, CreateMemoCmd{
		Content: []byte("Test Content. replace_me"),
	})
	require.NoError(t, err)

	memo, err := ctrl.GetMemo(ctx, createdID)
	require.NoError(t, err)
	assert.Equal(t, "Test Content. New Content", string(memo.Content))

	err = ctrl.UpdateMemo(ctx, UpdateMemoCmd{
		MemoID:  createdID,
		Content: []byte("Updated Content. replace_me"),
	})
	require.NoError(t, err)

	memo, err = ctrl.GetMemo(ctx, createdID)
	require.NoError(t, err)
	assert.Equal(t, "Updated Content. New Content", string(memo.Content))
}

func TestMemoControl_Plugins_AfterSaved(t *testing.T) {
	t.Parallel()
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	ctx = auth.CtxWithAccount(ctx, &auth.Account{ID: 1})

	pluginMemoID := domain.MemoID(-1)

	ctrl := setupMemoControl(ctx, t, &testMemoPlugin{
		name: "Memos.AfterUpdate",
		memoSavedPlugin: func(ctx context.Context, memo *domain.Memo) error {
			pluginMemoID = memo.ID
			return nil
		},
	})

	createdID, err := ctrl.CreateMemo(ctx, CreateMemoCmd{
		Content: []byte("Test Content."),
	})
	require.NoError(t, err)
	assert.Equal(t, createdID, pluginMemoID)

	pluginMemoID = domain.MemoID(-1)

	err = ctrl.UpdateMemo(ctx, UpdateMemoCmd{
		MemoID:  createdID,
		Content: []byte("Updated Content"),
	})
	require.NoError(t, err)
	assert.Equal(t, createdID, pluginMemoID)
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

func setupMemoControl(ctx context.Context, t *testing.T, plugins ...plugins.Plugin) *MemoControl {
	db := testhelper.NewInMemTestSQLite(ctx, t)

	accountRepo := sqlite.NewAccountRepo(db)
	memoRepo := sqlite.NewMemoRepo(db)
	attachmentRepo := sqlite.NewAttachmentRepo(db)

	err := accountRepo.Create(ctx, &auth.Account{Username: t.Name(), DisplayName: t.Name(), IsAdmin: true})
	if err != nil {
		t.Fatal(err)
	}

	return NewMemoControl(db, memoRepo, attachmentRepo, plugins)
}

type testMemoPlugin struct {
	name              string
	memoContentPlugin func(ctx context.Context, content []byte) ([]byte, error)
	memoSavedPlugin   func(ctx context.Context, memo *domain.Memo) error
}

func (p *testMemoPlugin) Name() string {
	return p.name
}

func (p *testMemoPlugin) MemoContentPlugin(ctx context.Context, content []byte) ([]byte, error) {
	if p.memoContentPlugin == nil {
		return content, nil
	}
	return p.memoContentPlugin(ctx, content)
}

func (p *testMemoPlugin) MemoSavedPlugin(ctx context.Context, memo *domain.Memo) error {
	if p.memoSavedPlugin == nil {
		return nil
	}

	return p.memoSavedPlugin(ctx, memo)
}
