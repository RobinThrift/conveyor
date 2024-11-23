package filesystem

import (
	"context"
	"path"
	"strings"
	"testing"

	"github.com/RobinThrift/belt/internal/domain"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLocalFSAttachments(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	fs := LocalFSAttachments{AttachmentsDir: t.TempDir(), TmpDir: t.TempDir()} //nolint: varnamelen // this is just a test

	files := []struct {
		a    domain.Attachment
		data string
	}{
		{
			a:    domain.Attachment{OriginalFilename: "test-0.txt"},
			data: "content for test-0.txt",
		},
		{
			a:    domain.Attachment{OriginalFilename: "test-1.txt"},
			data: "content for test-1.txt",
		},
	}

	err := fs.WriteAttachment(ctx, &files[0].a, strings.NewReader(files[0].data))
	require.NoError(t, err)
	assert.Equal(t, int64(22), files[0].a.SizeBytes)
	assert.FileExists(t, path.Join(fs.AttachmentsDir, files[0].a.Filepath))

	err = fs.WriteAttachment(ctx, &files[0].a, strings.NewReader(files[0].data))
	require.NoError(t, err)

	assert.FileExists(t, path.Join(fs.AttachmentsDir, files[0].a.Filepath))

	err = fs.WriteAttachment(ctx, &files[1].a, strings.NewReader(files[1].data))
	require.NoError(t, err)
	assert.Equal(t, int64(22), files[1].a.SizeBytes)

	assert.FileExists(t, path.Join(fs.AttachmentsDir, files[1].a.Filepath))
}
