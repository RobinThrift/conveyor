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
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	repo := setupMemoRepo(ctx, t)

	numMemos := 500
	now := time.Date(2024, 03, 15, 12, 0, 0, 0, time.UTC)

	// Create new Memos
	for i := 0; i < numMemos; i++ {
		_, err := repo.CreateMemo(ctx, &domain.Memo{
			Content:   []byte(fmt.Sprintf("# Test Memo %[1]d\n With some more content for memo %[1]d\n #tag-%[1]d #parent/tag-%[2]d #mod-two-is-%d", i, i+1, i%2)),
			CreatedBy: auth.AccountID(1),
			CreatedAt: now.Add(-time.Hour * time.Duration(i)),
		})
		require.NoError(t, err)
	}

	var lastMemoDate *time.Time
	var lastMemoID = domain.MemoID(-1)
	// List All Memos in batches of 25
	for i := 0; i < numMemos; i += 25 {
		q := ListMemosQuery{
			PageSize:  25,
			PageAfter: lastMemoDate,
		}

		list, err := repo.ListMemos(ctx, q)
		require.NoError(t, err, i)

		require.Lenf(t, list.Items, 25, "i = %d", i)
		require.NotEqualf(t, lastMemoID, list.Items[0].ID, "i = %d", i)
		lastMemoID = list.Items[len(list.Items)-1].ID
		lastMemoDate = list.Next
	}

	t.Run("Filter by CreatedAt Date", func(t *testing.T) {
		t.Parallel()

		q := ListMemosQuery{
			PageSize:  25,
			CreatedAt: &now,
		}

		list, err := repo.ListMemos(ctx, q)
		require.NoError(t, err)

		require.Len(t, list.Items, 13)
	})

	t.Run("Filter by MinCreationDate", func(t *testing.T) {
		t.Parallel()

		minCreationDate := now.Add(time.Hour * -24)
		q := ListMemosQuery{
			PageSize:        uint64(numMemos),
			MinCreationDate: &minCreationDate,
		}

		list, err := repo.ListMemos(ctx, q)
		require.NoError(t, err)

		require.Len(t, list.Items, numMemos-13)
	})

	t.Run("Filter By Tag", func(t *testing.T) {
		t.Parallel()

		tag := "mod-two-is-1"
		q := ListMemosQuery{
			PageSize: uint64(numMemos),
			Tag:      &tag,
		}

		list, err := repo.ListMemos(ctx, q)
		require.NoError(t, err)

		require.Len(t, list.Items, numMemos/2)
	})

	t.Run("Filter with Full Text Search Query", func(t *testing.T) {
		t.Parallel()

		search := `# Test Memo 1*` //nolint:goconst // in test code
		q := ListMemosQuery{
			PageSize: uint64(numMemos),
			Search:   &search,
		}

		list, err := repo.ListMemos(ctx, q)
		require.NoError(t, err)

		require.Len(t, list.Items, 111) // 10-19 + 100-199 inclusive
	})

	t.Run("Filter by Multiple", func(t *testing.T) {
		t.Parallel()

		minCreationDate := now.Add(time.Hour * -24)
		search := "# Test Memo 1*"
		q := ListMemosQuery{
			PageSize:        uint64(numMemos),
			Search:          &search,
			MinCreationDate: &minCreationDate,
		}

		list, err := repo.ListMemos(ctx, q)
		require.NoError(t, err)

		require.Len(t, list.Items, 107) // 111 => the first 4 that start with 1x and are before the min date
	})

	t.Run("Filter by Tag with Full Text Search Query", func(t *testing.T) {
		t.Parallel()

		tag := "mod-two-is-1"
		search := `# Test Memo 1*`
		q := ListMemosQuery{
			PageSize: uint64(numMemos),
			Tag:      &tag,
			Search:   &search,
		}

		list, err := repo.ListMemos(ctx, q)
		require.NoError(t, err)

		require.Len(t, list.Items, 56) // roundUp(111/2): 111 as explained above, div by 2 because modulus 2 is 1 for half the Memos
	})
}

func Test_MemoRepo_CRUD(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	repo := setupMemoRepo(ctx, t)

	numMemos := 10
	now := time.Date(2024, 03, 15, 12, 0, 0, 0, time.UTC)

	// Create new Memos
	for i := 0; i < numMemos; i++ {
		_, err := repo.CreateMemo(ctx, &domain.Memo{
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

		err = repo.UpdateArchiveStatus(ctx, memo.ID, true)
		require.NoError(t, err)

		archived, err := repo.GetMemo(ctx, domain.MemoID(2))
		require.NoError(t, err)

		assert.True(t, archived.IsArchived)
		assert.True(t, archived.UpdatedAt.After(memo.UpdatedAt))

		err = repo.UpdateArchiveStatus(ctx, memo.ID, false)
		require.NoError(t, err)

		noLongerArchived, err := repo.GetMemo(ctx, domain.MemoID(2))
		require.NoError(t, err)

		assert.False(t, noLongerArchived.IsArchived)
		assert.True(t, noLongerArchived.UpdatedAt.After(memo.UpdatedAt))
	})

	t.Run("ArchiveMemo/Not Found", func(t *testing.T) {
		err := repo.UpdateArchiveStatus(ctx, domain.MemoID(99), true)
		require.ErrorIs(t, err, domain.ErrMemoNotFound)

		err = repo.UpdateArchiveStatus(ctx, domain.MemoID(99), false)
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

		count, err := repo.CleanupDeletedMemos(ctx)
		require.NoError(t, err)
		assert.Equal(t, int64(1), count)

		_, err = repo.GetMemo(ctx, domain.MemoID(2))
		require.ErrorIs(t, err, domain.ErrMemoNotFound)
	})
}

func Test_MemoRepo_Create(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	repo := setupMemoRepo(ctx, t)

	now := time.Date(2024, 03, 15, 12, 0, 0, 0, time.UTC)

	// Create new Memos
	_, err := repo.CreateMemo(ctx, &domain.Memo{
		Content:   []byte("# Test Memo\n With some more content"),
		CreatedBy: auth.AccountID(1),
		CreatedAt: now,
	})
	require.NoError(t, err)

	t.Run("With Non-Existent Account ID", func(t *testing.T) {
		_, err := repo.CreateMemo(ctx, &domain.Memo{
			Content:   []byte(""),
			CreatedBy: auth.AccountID(100),
			CreatedAt: now,
		})
		require.Error(t, err)
	})
}

func Test_MemoRepo_Tags(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	repo := setupMemoRepo(ctx, t)

	numMemos := 10
	now := time.Date(2024, 03, 15, 12, 0, 0, 0, time.UTC)

	// Create new Memos
	for i := 0; i < numMemos; i++ {
		_, err := repo.CreateMemo(ctx, &domain.Memo{
			Content:   []byte(fmt.Sprintf("# Test Memo %[1]d\n With some more content for memo %[1]d #tag-%[1]d #shared-tag", i)),
			CreatedBy: auth.AccountID(1),
			CreatedAt: now.Add(-time.Hour * time.Duration(i)),
		})
		require.NoError(t, err)
	}

	t.Run("Tags for newly created Memos exist", func(t *testing.T) {
		tags, err := repo.ListTags(ctx, ListTagsQuery{PageSize: uint64(numMemos * 2)})
		require.NoError(t, err)
		assert.Len(t, tags.Items, numMemos+1)
		for _, tag := range tags.Items {
			if tag.Tag == "shared-tag" {
				assert.Equal(t, int64(numMemos), tag.Count)
			} else {
				assert.Equal(t, int64(1), tag.Count)
			}
		}
	})

	t.Run("Tag count doesn't change after Memo update if no tags were added or removed", func(t *testing.T) {
		// Update Memos; uncahnged tags
		for i := 0; i < numMemos; i++ {
			err := repo.UpdateMemoContent(ctx, &domain.Memo{
				ID:        domain.MemoID(i + 1),
				Content:   []byte(fmt.Sprintf("# Test Memo %[1]d\n Updated content for memo %[1]d #tag-%[1]d #shared-tag", i)),
				CreatedBy: auth.AccountID(1),
			})
			require.NoError(t, err)
		}

		tags, err := repo.ListTags(ctx, ListTagsQuery{PageSize: uint64(numMemos * 2)})
		require.NoError(t, err)
		assert.Len(t, tags.Items, numMemos+1)
		for _, tag := range tags.Items {
			if tag.Tag == "shared-tag" {
				assert.Equal(t, int64(numMemos), tag.Count)
			} else {
				assert.Equal(t, int64(1), tag.Count)
			}
		}
	})

	t.Run("Tags are removed when count reaches 0", func(t *testing.T) {
		// Update Memos; remove unique tags tags
		for i := 0; i < numMemos; i++ {
			err := repo.UpdateMemoContent(ctx, &domain.Memo{
				ID:        domain.MemoID(i + 1),
				Content:   []byte(fmt.Sprintf("# Test Memo %[1]d\n Updated content for memo %[1]d #shared-tag", i)),
				CreatedBy: auth.AccountID(1),
			})
			require.NoError(t, err)
		}

		tags, err := repo.ListTags(ctx, ListTagsQuery{PageSize: uint64(numMemos * 2)})
		require.NoError(t, err)
		assert.Len(t, tags.Items, 1)
		assert.Equal(t, int64(numMemos), tags.Items[0].Count)
	})

	t.Run("Tag count is reduced when Memos are deleted", func(t *testing.T) {
		for i := 0; i < numMemos; i++ {
			err := repo.DeleteMemo(ctx, domain.MemoID(i+1))
			require.NoError(t, err)
		}

		_, err := repo.CleanupDeletedMemos(ctx)
		require.NoError(t, err)

		tags, err := repo.ListTags(ctx, ListTagsQuery{PageSize: uint64(numMemos * 2)})
		require.NoError(t, err)
		assert.Len(t, tags.Items, 0)
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
