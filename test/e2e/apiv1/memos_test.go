package apiv1_test

import (
	"context"
	"testing"
	"time"

	"github.com/RobinThrift/belt/internal/ingress/apiv1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMemos(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	client := setup(ctx, t)

	memos, err := get[apiv1.MemoList](ctx, client, "/api/v1/memos", "page[size]", "10")
	require.NoError(t, err)
	require.NotNil(t, memos)

	t.Run("Create Memo with no current date", func(t *testing.T) {
		t.Parallel()

		now := time.Now()
		content := "Test Memo 1 content"

		created, err := post[apiv1.CreateMemoRequest, apiv1.Memo](ctx, client, "/api/v1/memos", apiv1.CreateMemoRequest{
			Content: content,
		})
		require.NoError(t, err)
		assert.NotNil(t, created)
		assert.Equal(t, content, created.Content)
		assert.WithinRange(t, created.CreatedAt, now.Add(-time.Second*5), now.Add(time.Second*5))
	})

	t.Run("Create Memo with explicit date", func(t *testing.T) {
		t.Parallel()

		createdAt := time.Now().Add(-time.Hour * 48)
		content := "Test Memo 1 content"

		created, err := post[apiv1.CreateMemoRequest, apiv1.Memo](ctx, client, "/api/v1/memos", apiv1.CreateMemoRequest{
			Content:   content,
			CreatedAt: &createdAt,
		})
		require.NoError(t, err)
		assert.NotNil(t, created)
		assert.Equal(t, content, created.Content)
		assert.WithinRange(t, created.CreatedAt, createdAt.Add(-time.Second*5), createdAt.Add(time.Second*5))
	})
}
