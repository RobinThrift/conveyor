package apiv1_test

import (
	"context"
	"io"
	"strings"
	"testing"

	"github.com/RobinThrift/belt/internal/ingress/apiv1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAttachments(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	client := setup(ctx, t)

	created, err := postRaw[io.Reader, apiv1.Attachment](ctx, client, "/api/v1/attachments", strings.NewReader("Test Content"), "X-Filename", "test-file.txt")
	require.NoError(t, err)
	assert.NotNil(t, created)

	attachments, err := get[apiv1.AttachmentList](ctx, client, "/api/v1/attachments", "page[size]", "10")
	require.NoError(t, err)
	assert.NotNil(t, attachments)
	assert.Len(t, attachments.Items, 1)

	attachment, err := getRaw(ctx, client, created.Url)
	require.NoError(t, err)
	assert.Equal(t, "Test Content", string(attachment))
}

func TestAttachment_WithSpacesInFileName(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	client := setup(ctx, t)

	created, err := postRaw[io.Reader, apiv1.Attachment](ctx, client, "/api/v1/attachments", strings.NewReader("Test Content"), "X-Filename", "annoying spaces in file name.txt")
	require.NoError(t, err)
	assert.NotNil(t, created)

	attachments, err := get[apiv1.AttachmentList](ctx, client, "/api/v1/attachments", "page[size]", "10")
	require.NoError(t, err)
	assert.NotNil(t, attachments)
	assert.Len(t, attachments.Items, 1)

	attachment, err := getRaw(ctx, client, created.Url)
	require.NoError(t, err)
	assert.Equal(t, "Test Content", string(attachment))
}
