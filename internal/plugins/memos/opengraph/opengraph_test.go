package opengraph

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/control"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite"
	"github.com/RobinThrift/belt/internal/storage/filesystem"
	"github.com/RobinThrift/belt/internal/testhelper"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestOpenGraphPlugin(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	ctx = auth.CtxWithAccount(ctx, &auth.Account{ID: 1})

	url := startTestServer(t)

	plugin := setupOpenGraphPlugin(ctx, t)

	tt := []struct {
		name     string
		input    string
		expected string
	}{
		{name: "Empty Content"},

		{
			name:     "Single Line Link Only",
			input:    url + "/RobinThrift/belt",
			expected: `::open-graph-link[https://github.com/RobinThrift/belt]{title="GitHub - RobinThrift/belt" description="Contribute to RobinThrift/belt development by creating an account on GitHub." img="/attachments/e3/b0/c4/42/98/fc/1c/14/9a/fb/f4/c8/99/6f/b9/24/27/ae/41/e4/64/9b/93/4c/a4/95/99/1b/78/52/b8/55/belt.png" alt="Contribute to RobinThrift/belt development by creating an account on GitHub."}`,
		},

		{
			name:     "Single Link padded with Empty Lines and Whitespace",
			input:    "\n \n" + url + "/RobinThrift/belt\n\t\n ",
			expected: `::open-graph-link[https://github.com/RobinThrift/belt]{title="GitHub - RobinThrift/belt" description="Contribute to RobinThrift/belt development by creating an account on GitHub." img="/attachments/e3/b0/c4/42/98/fc/1c/14/9a/fb/f4/c8/99/6f/b9/24/27/ae/41/e4/64/9b/93/4c/a4/95/99/1b/78/52/b8/55/belt.png" alt="Contribute to RobinThrift/belt development by creating an account on GitHub."}`,
		},

		{
			name:  "Single Link with tags after",
			input: url + "/RobinThrift/belt\n\t\t#tag-a #tag-b\n\t\t#tag-c",
			expected: `::open-graph-link[https://github.com/RobinThrift/belt]{title="GitHub - RobinThrift/belt" description="Contribute to RobinThrift/belt development by creating an account on GitHub." img="/attachments/e3/b0/c4/42/98/fc/1c/14/9a/fb/f4/c8/99/6f/b9/24/27/ae/41/e4/64/9b/93/4c/a4/95/99/1b/78/52/b8/55/belt.png" alt="Contribute to RobinThrift/belt development by creating an account on GitHub."}
		#tag-a #tag-b
		#tag-c`,
		},

		{
			name:  "Single Link with tags after and Empty Lines with Whitespace",
			input: "\n \n" + url + "/RobinThrift/belt\n\t\t#tag-a #tag-b\n\t\t#tag-c\n \n",
			expected: `::open-graph-link[https://github.com/RobinThrift/belt]{title="GitHub - RobinThrift/belt" description="Contribute to RobinThrift/belt development by creating an account on GitHub." img="/attachments/e3/b0/c4/42/98/fc/1c/14/9a/fb/f4/c8/99/6f/b9/24/27/ae/41/e4/64/9b/93/4c/a4/95/99/1b/78/52/b8/55/belt.png" alt="Contribute to RobinThrift/belt development by creating an account on GitHub."}
		#tag-a #tag-b
		#tag-c`,
		},

		{
			name:     "Fist line is not Link",
			input:    "\n# Heading 1\n" + url + "/RobinThrift/belt",
			expected: "\n# Heading 1\n" + url + "/RobinThrift/belt",
		},

		{
			name: "Multiple Lines Valid",
			input: url + `/RobinThrift/belt
This is a short description of the link #and #some #tags
and another link: ` + url + "/RobinThrift/stuff",
			expected: `::open-graph-link[https://github.com/RobinThrift/belt]{title="GitHub - RobinThrift/belt" description="Contribute to RobinThrift/belt development by creating an account on GitHub." img="/attachments/e3/b0/c4/42/98/fc/1c/14/9a/fb/f4/c8/99/6f/b9/24/27/ae/41/e4/64/9b/93/4c/a4/95/99/1b/78/52/b8/55/belt.png" alt="Contribute to RobinThrift/belt development by creating an account on GitHub."}
This is a short description of the link #and #some #tags
and another link: ` + url + "/RobinThrift/stuff",
		},

		{
			name:     "First Line contains link and other content",
			input:    url + "/RobinThrift/belt #tag-a #tag-b",
			expected: url + "/RobinThrift/belt #tag-a #tag-b",
		},
	}

	for _, tt := range tt {
		t.Run(tt.name, func(t *testing.T) {
			actual, err := plugin.MemoContentPlugin(ctx, []byte(tt.input))
			require.NoError(t, err)
			assert.Equal(t, tt.expected, string(actual))
		})
	}

}

func startTestServer(t *testing.T) string {
	url := ""
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/opengraph/imgs/RobinThrift/belt" {
			w.Header().Set("Content-Type", "image/png")
			_, _ = w.Write([]byte(""))
			return
		}
		_, _ = w.Write([]byte(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>RobinThrift/belt</title>
    <meta property="og:image" content="` + url + `/opengraph/imgs/RobinThrift/belt"/>
    <meta property="og:image:alt" content="Contribute to RobinThrift/belt development by creating an account on GitHub."/>
    <meta property="og:image:width" content="1200"/>
    <meta property="og:image:height" content="600"/>
    <meta property="og:site_name" content="GitHub"/>
    <meta property="og:type" content="object"/>
    <meta property="og:title" content="RobinThrift/belt"/>
    <meta property="og:url" content="https://github.com/RobinThrift/belt"/>
    <meta property="og:description" content="Contribute to RobinThrift/belt development by creating an account on GitHub."/>
</head>

<body class="logged-in env-production page-responsive" style="word-wrap: break-word;">
</body>`))
	}))

	url = srv.URL

	t.Cleanup(srv.Close)
	return srv.URL
}

func setupOpenGraphPlugin(ctx context.Context, t *testing.T) *OpenGraphPlugin {
	t.Helper()

	db := testhelper.NewInMemTestSQLite(ctx, t)

	accountRepo := sqlite.NewAccountRepo(db)
	attachmentRepo := sqlite.NewAttachmentRepo(db)

	fs := &filesystem.LocalFSAttachments{
		AttachmentsDir: t.TempDir(),
		TmpDir:         t.TempDir(),
	}

	err := accountRepo.Create(ctx, &auth.Account{Username: t.Name(), DisplayName: t.Name(), IsAdmin: true})
	if err != nil {
		t.Fatal(err)
	}

	return NewOpenGraphPlugin("/", control.NewAttachmentControl(fs, attachmentRepo))
}
