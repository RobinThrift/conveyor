package sqlite

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/domain"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_MemoRepo_Querying(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	repo := setupMemoRepo(ctx, t)

	numMemos := 500
	now := time.Date(2024, 03, 15, 12, 0, 0, 0, time.UTC)

	// Create new Memos
	for i := 0; i < numMemos; i++ {
		err := repo.CreateMemo(ctx, &domain.Memo{
			Name:      fmt.Sprintf("Test Memo %d", i),
			Content:   []byte(fmt.Sprintf("# Test Memo %[1]d\n With some more content for memo %[1]d\n #tag-%[1]d #parent/tag-%[2]d", i, i+1)),
			CreatedBy: auth.AccountID(1),
			CreatedAt: now.Add(-time.Hour * time.Duration(i)),
		})
		require.NoError(t, err)
	}

	var lastMemoID *domain.MemoID
	// List All Memos in batches of 25
	for i := 0; i < numMemos; i += 25 {
		q := ListMemosQuery{
			AccountID: auth.AccountID(1),
			PageSize:  25,
			After:     lastMemoID,
		}

		list, err := repo.ListMemos(ctx, q)
		require.NoError(t, err, i)

		require.Len(t, list.Items, 25, i)
		lastMemoID = list.Next
	}

	t.Run("With CreatedAt Date", func(t *testing.T) {
		q := ListMemosQuery{
			AccountID: auth.AccountID(1),
			PageSize:  25,
			CreatedAt: &now,
		}

		list, err := repo.ListMemos(ctx, q)
		require.NoError(t, err)

		require.Len(t, list.Items, 13)
		lastMemoID = list.Next
	})

	t.Run("With MinCreationDate", func(t *testing.T) {
		minCreationDate := now.Add(time.Hour * -24)
		q := ListMemosQuery{
			AccountID:       auth.AccountID(1),
			PageSize:        uint64(numMemos),
			MinCreationDate: &minCreationDate,
		}

		list, err := repo.ListMemos(ctx, q)
		require.NoError(t, err)

		require.Len(t, list.Items, numMemos-13)
		lastMemoID = list.Next
	})

	t.Run("With Search Query", func(t *testing.T) {
		search := `"# Test Memo 1"*`
		q := ListMemosQuery{
			AccountID: auth.AccountID(1),
			PageSize:  uint64(numMemos),
			Search:    &search,
		}

		list, err := repo.ListMemos(ctx, q)
		require.NoError(t, err)

		fmt.Printf("list %s\n", list.Items[0].Content)
		require.Len(t, list.Items, 111) // 10-19 + 100-199 inclusive
		lastMemoID = list.Next
	})

	// t.Run("With Multiple Filters", func(t *testing.T) {
	// 	minCreationDate := now.Add(time.Hour * -24)
	// 	search := "# Test Memo 1*"
	// 	q := ListMemosQuery{
	// 		AccountID:       auth.AccountID(1),
	// 		PageSize:        uint64(numMemos),
	// 		Search:          &search,
	// 		MinCreationDate: &minCreationDate,
	// 	}
	//
	// 	list, err := repo.ListMemos(ctx, q)
	// 	require.NoError(t, err)
	//
	// 	require.Len(t, list.Items, 107) // 111 - the first 4 that start with 1x and are before the min date
	// 	lastMemoID = list.Next
	// })
}

func Test_MemoRepo_CRUD(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	repo := setupMemoRepo(ctx, t)

	numMemos := 10
	now := time.Date(2024, 03, 15, 12, 0, 0, 0, time.UTC)

	// Create new Memos
	for i := 0; i < numMemos; i++ {
		err := repo.CreateMemo(ctx, &domain.Memo{
			Name:      fmt.Sprintf("Test Memo %d", i),
			Content:   []byte(fmt.Sprintf("# Test Memo %d\n With some more content for memo %d", i, i)),
			CreatedBy: auth.AccountID(1),
			CreatedAt: now.Add(-time.Hour * time.Duration(i)),
		})
		require.NoError(t, err)
	}

	t.Run("GetMemo", func(t *testing.T) {
		memo, err := repo.GetMemo(ctx, domain.MemoID(1))
		require.NoError(t, err)
		require.NotNil(t, memo)
	})

	t.Run("GetMemo/Not Found", func(t *testing.T) {
		memo, err := repo.GetMemo(ctx, domain.MemoID(99))
		require.ErrorIs(t, err, domain.ErrMemoNotFound)
		require.Nil(t, memo)
	})

	t.Run("UpdateMemoContent", func(t *testing.T) {
		memo, err := repo.GetMemo(ctx, domain.MemoID(2))
		require.NoError(t, err)
		memo.Content = []byte("Update Content for Memo 2")

		time.Sleep(time.Second) // ensure the updated_at field has changed as it only has second resolution

		err = repo.UpdateMemoContent(ctx, memo)
		require.NoError(t, err)

		updated, err := repo.GetMemo(ctx, domain.MemoID(2))
		require.NoError(t, err)

		assert.Equal(t, string(memo.Content), string(updated.Content))
		assert.True(t, updated.UpdatedAt.After(memo.UpdatedAt))
	})

	t.Run("UpdateMemoContent/Not Found", func(t *testing.T) {
		err := repo.UpdateMemoContent(ctx, &domain.Memo{
			ID: domain.MemoID(99),
		})
		require.ErrorIs(t, err, domain.ErrMemoNotFound)
	})

	t.Run("ArchiveMemo", func(t *testing.T) {
		memo, err := repo.GetMemo(ctx, domain.MemoID(2))
		require.NoError(t, err)

		time.Sleep(time.Second) // ensure the updated_at field has changed as it only has second resolution

		err = repo.ArchiveMemo(ctx, memo.ID)
		require.NoError(t, err)

		archived, err := repo.GetMemo(ctx, domain.MemoID(2))
		require.NoError(t, err)

		assert.True(t, archived.IsArchived)
		assert.True(t, archived.UpdatedAt.After(memo.UpdatedAt))
	})

	t.Run("ArchiveMemo/Not Found", func(t *testing.T) {
		err := repo.ArchiveMemo(ctx, domain.MemoID(99))
		require.ErrorIs(t, err, domain.ErrMemoNotFound)
	})

	t.Run("DeleteMemo/Not Found", func(t *testing.T) {
		err := repo.DeleteMemo(ctx, domain.MemoID(99))
		require.NoError(t, err)
	})

	t.Run("DeleteMemo", func(t *testing.T) {
		memo, err := repo.GetMemo(ctx, domain.MemoID(2))
		require.NoError(t, err)

		time.Sleep(time.Second) // ensure the updated_at field has changed as it only has second resolution

		err = repo.DeleteMemo(ctx, memo.ID)
		require.NoError(t, err)

		deleted, err := repo.GetMemo(ctx, domain.MemoID(2))
		require.NoError(t, err)

		assert.True(t, deleted.UpdatedAt.After(memo.UpdatedAt))

		_, err = repo.db.ExecContext(ctx, "UPDATE memos SET updated_at = date('now','-40 days') WHERE id = ?", int64(deleted.ID))
		require.NoError(t, err)

		_, err = repo.CleanupDeletedMemos(ctx)
		require.NoError(t, err)

		_, err = repo.GetMemo(ctx, domain.MemoID(2))
		require.ErrorIs(t, err, domain.ErrMemoNotFound)
	})
}

func Test_MemoRepo_Create(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	repo := setupMemoRepo(ctx, t)

	now := time.Date(2024, 03, 15, 12, 0, 0, 0, time.UTC)

	// Create new Memos
	err := repo.CreateMemo(ctx, &domain.Memo{
		Name:      "Test Memo",
		Content:   []byte("# Test Memo\n With some more content"),
		CreatedBy: auth.AccountID(1),
		CreatedAt: now,
	})
	require.NoError(t, err)

	t.Run("With Non-Existent Account ID", func(t *testing.T) {
		err := repo.CreateMemo(ctx, &domain.Memo{
			Name:      "",
			Content:   []byte(""),
			CreatedBy: auth.AccountID(100),
			CreatedAt: now,
		})
		require.Error(t, err)
	})
}

func setupMemoRepo(ctx context.Context, t *testing.T) *MemoRepo {
	t.Helper()
	db := newTestDB(ctx, t)

	accountRepo := NewAccountRepo(db)

	err := accountRepo.Create(ctx, &auth.Account{Username: "user", DisplayName: "user", IsAdmin: true})
	if err != nil {
		t.Fatal(err)
	}

	return NewMemoRepo(db)
}
