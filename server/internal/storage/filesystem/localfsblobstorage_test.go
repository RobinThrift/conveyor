package filesystem

import (
	"fmt"
	"path"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.robinthrift.com/conveyor/internal/domain"
)

func TestLocalFSBlobStorage(t *testing.T) {
	t.Parallel()

	fs := LocalFSBlobStorage{BaseDir: t.TempDir(), TmpDir: t.TempDir()}

	tt := []struct {
		accountID domain.AccountID
		filename  string
		data      string
		size      int64
	}{
		{
			accountID: domain.AccountID(1000),
			filename:  "test-0.txt",
			data:      "content for test-0.txt",
			size:      22,
		},
		{
			accountID: domain.AccountID(1000),
			filename:  "test-1.txt",
			data:      "content for test-1.txt",
			size:      22,
		},
	}

	for _, tt := range tt {
		sizeBytes, err := fs.WriteBlob(tt.accountID, tt.filename, strings.NewReader(tt.data))
		require.NoError(t, err)
		assert.Equal(t, tt.size, sizeBytes)
		assert.FileExists(t, path.Join(fs.BaseDir, fmt.Sprint(tt.accountID), tt.filename))
	}
}
