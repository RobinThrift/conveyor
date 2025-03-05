package filesystem

import (
	"fmt"
	"path"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.robinthrift.com/belt/internal/domain"
)

func TestLocalFSBlobStorage(t *testing.T) {
	fs := LocalFSBlobStorage{BaseDir: t.TempDir(), TmpDir: t.TempDir()} //nolint: varnamelen // this is just a test

	files := []struct {
		accountID domain.AccountID
		filename  string
		data      string
	}{
		{
			accountID: domain.AccountID(1000),
			filename:  "test-0.txt",
			data:      "content for test-0.txt",
		},
		{
			accountID: domain.AccountID(1000),
			filename:  "test-1.txt",
			data:      "content for test-1.txt",
		},
	}

	_, err := fs.WriteBlob(files[0].accountID, files[0].filename, strings.NewReader(files[0].data))
	require.NoError(t, err)

	_, err = fs.WriteBlob(files[0].accountID, files[0].filename, strings.NewReader(files[0].data))
	require.NoError(t, err)

	assert.FileExists(t, path.Join(fs.BaseDir, fmt.Sprint(files[0].accountID), files[0].filename))

	_, err = fs.WriteBlob(files[0].accountID, files[1].filename, strings.NewReader(files[1].data))
	require.NoError(t, err)

	assert.FileExists(t, path.Join(fs.BaseDir, fmt.Sprint(files[1].accountID), files[1].filename))
}
