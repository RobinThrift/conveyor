package control

import (
	"bytes"
	"encoding/json"
	"os"
	"path"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.robinthrift.com/conveyor/internal/auth"
	"go.robinthrift.com/conveyor/internal/domain"
	"go.robinthrift.com/conveyor/internal/storage/database/sqlite"
	"go.robinthrift.com/conveyor/internal/storage/filesystem"
	"go.robinthrift.com/conveyor/internal/testhelper"
)

const privateKey = "AGE-SECRET-KEY-1WZ5GFZQGKFZGT8S758UUADDCCQTYE05PU7XG2XZ786HDJ9T325SQ9DG7WG"
const publicKey = "age1py392mrpw6tv0rm2gvcz5lwugmnw3j05nzqgs0w9thnq6qeu3pns9mryhf"

func TestSyncController_CreateMemoChangelogEntry(t *testing.T) {
	t.Parallel()

	t.Run("Plaintext", func(t *testing.T) {
		t.Parallel()
		setup := setupSyncCtrlTest(t)

		now := time.Now()

		ctx := auth.CtxWithAccount(t.Context(), &domain.Account{ID: domain.AccountID(1)})

		err := setup.syncCtrl.CreateMemoChangelogEntry(ctx, CreateMemoChangelogEntryCmd{
			PlaintextMemo: &PlaintextMemo{
				Content:   "# Plaintext Memo\nContent here.",
				CreatedAt: &now,
			},
		})

		require.NoError(t, err)
	})

	t.Run("Plaintext/Key Not Found", func(t *testing.T) {
		t.Parallel()
		setup := setupSyncCtrlTest(t)

		now := time.Now()

		ctx := auth.CtxWithAccount(t.Context(), &domain.Account{ID: domain.AccountID(100)})

		err := setup.syncCtrl.CreateMemoChangelogEntry(ctx, CreateMemoChangelogEntryCmd{
			PlaintextMemo: &PlaintextMemo{
				Content:   "# Plaintext Memo\nContent here.",
				CreatedAt: &now,
			},
		})

		assert.ErrorIs(t, err, domain.ErrAccountKeyNotFound)
	})
}

func TestSyncController_CreateAttachmentChangelogEntry_Unencrypted(t *testing.T) {
	t.Parallel()
	setup := setupSyncCtrlTest(t)
	ctx := auth.CtxWithAccount(t.Context(), &domain.Account{ID: domain.AccountID(1)})

	content := "TestSyncController_CreateAttachmentChangelogEntry_Unencrypted"

	data := bytes.NewReader([]byte(content))

	id, err := setup.syncCtrl.CreateAttachmentChangelogEntry(ctx, CreateAttachmentChangelogEntryCmd{
		OriginalFilename: "test.txt",
		ContentType:      "text/plain",
		Data:             data,
		IsEncrytped:      false,
	})

	require.NoError(t, err)
	assert.NotEmpty(t, id)

	file, err := os.Open(path.Join(setup.blobDir, "1", "c1/89/da/dc/f9/db/36/cc/e1/8a/f5/56/97/61/6e/ee/18/07/e3/4c/43/95/70/3d/5b/cf/46/21/97/50/a2/e0"))
	require.NoError(t, err)

	t.Cleanup(func() { file.Close() })

	written := testhelper.AgeDecrypt(t, privateKey, file)
	require.NoError(t, err)

	assert.Equal(t, content, string(written))

	entries, err := setup.syncCtrl.ListChangelogEntries(ctx, ListChangelogEntriesQuery{})
	require.NoError(t, err)
	assert.Len(t, entries, 1)

	entryJSON := testhelper.AgeDecrypt(t, privateKey, bytes.NewReader(entries[0].Data))

	var entry createAttachmentChangelogEntry
	err = json.Unmarshal(entryJSON, &entry)
	require.NoError(t, err)

	assert.Equal(t, int64(61), entry.Value.Created.SizeBytes)
	assert.Equal(t, "/c1/89/da/dc/f9/db/36/cc/e1/8a/f5/56/97/61/6e/ee/18/07/e3/4c/43/95/70/3d/5b/cf/46/21/97/50/a2/e0", entry.Value.Created.Filepath)
	assert.Equal(t, "test.txt", entry.Value.Created.OriginalFilename)
	assert.Equal(t, "text/plain", entry.Value.Created.ContentType)
	assert.Equal(t, "c189dadcf9db36cce18af55697616eee1807e34c4395703d5bcf46219750a2e0", entry.Value.Created.Sha256)
}

func TestSyncController_CreateAttachmentChangelogEntry_Encrypted(t *testing.T) {
	t.Parallel()
	setup := setupSyncCtrlTest(t)
	ctx := auth.CtxWithAccount(t.Context(), &domain.Account{ID: domain.AccountID(1)})

	content := "TestSyncController_CreateAttachmentChangelogEntry_Unencrypted"
	encrypted := testhelper.AgeEncrypt(t, publicKey, []byte(content))

	id, err := setup.syncCtrl.CreateAttachmentChangelogEntry(ctx, CreateAttachmentChangelogEntryCmd{
		ContentType:      "text/plain",
		Data:             bytes.NewReader(encrypted),
		IsEncrytped:      true,
		OriginalFilename: "file.txt",
		Filepath:         "/c1/89/da/dc/f9/db/36/cc/e1/8a/f5/56/97/61/6e/ee/18/07/e3/4c/43/95/70/3d/5b/cf/46/21/97/50/a2/e0",
		sizeBytes:        61,
		sha256:           []byte{0xc1, 0x89, 0xda, 0xdc, 0xf9, 0xdb, 0x36, 0xcc, 0xe1, 0x8a, 0xf5, 0x56, 0x97, 0x61, 0x6e, 0xee, 0x18, 0x07, 0xe3, 0x4c, 0x43, 0x95, 0x70, 0x3d, 0x5b, 0xcf, 0x46, 0x21, 0x97, 0x50, 0xa2, 0xe0},
	})

	require.NoError(t, err)
	assert.NotEmpty(t, id)

	file, err := os.Open(path.Join(setup.blobDir, "1", "c1/89/da/dc/f9/db/36/cc/e1/8a/f5/56/97/61/6e/ee/18/07/e3/4c/43/95/70/3d/5b/cf/46/21/97/50/a2/e0"))
	require.NoError(t, err)

	t.Cleanup(func() { file.Close() })

	written := testhelper.AgeDecrypt(t, privateKey, file)
	assert.Equal(t, content, string(written))

	entries, err := setup.syncCtrl.ListChangelogEntries(ctx, ListChangelogEntriesQuery{})
	require.NoError(t, err)
	assert.Len(t, entries, 1)

	entryJSON := testhelper.AgeDecrypt(t, privateKey, bytes.NewReader(entries[0].Data))

	var entry createAttachmentChangelogEntry
	err = json.Unmarshal(entryJSON, &entry)
	require.NoError(t, err)

	assert.Equal(t, int64(61), entry.Value.Created.SizeBytes)
	assert.Equal(t, "/c1/89/da/dc/f9/db/36/cc/e1/8a/f5/56/97/61/6e/ee/18/07/e3/4c/43/95/70/3d/5b/cf/46/21/97/50/a2/e0", entry.Value.Created.Filepath)
	assert.Equal(t, "file.txt", entry.Value.Created.OriginalFilename)
	assert.Equal(t, "text/plain", entry.Value.Created.ContentType)
	assert.Equal(t, "c189dadcf9db36cce18af55697616eee1807e34c4395703d5bcf46219750a2e0", entry.Value.Created.Sha256)
}

type syncCtrlTestSetup struct {
	syncCtrl *SyncController
	blobDir  string
}

func setupSyncCtrlTest(t *testing.T) syncCtrlTestSetup {
	t.Helper()
	db := testhelper.NewInMemTestSQLite(t)

	blobDir := t.TempDir()
	blobs := &filesystem.LocalFSBlobStorage{
		BaseDir: blobDir,
		TmpDir:  t.TempDir(),
	}

	accountRepo := sqlite.NewAccountRepo(db)
	syncRepo := sqlite.NewSyncRepo(db)

	err := accountRepo.Create(t.Context(), &domain.Account{Username: t.Name(), Password: domain.AccountPassword{Password: []byte("1234"), Salt: []byte("1234")}})
	if err != nil {
		t.Fatal(err)
	}

	err = accountRepo.CreateAccountKey(t.Context(), &domain.AccountKey{
		AccountID: domain.AccountID(1),
		Name:      domain.PrimaryAccountKeyName,
		Type:      "agev1",
		Data:      []byte(publicKey),
	})
	if err != nil {
		t.Fatal(err)
	}

	accountCtrl := NewAccountController(db, accountRepo)
	attachmentCtrl := NewAttachmentController(blobs)

	return syncCtrlTestSetup{
		syncCtrl: NewSyncController(db, syncRepo, accountCtrl, attachmentCtrl, blobs),
		blobDir:  blobDir,
	}
}
