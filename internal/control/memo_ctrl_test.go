package control

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_extractAssetURLs(t *testing.T) {
	content := []byte(`![filename_a.ext](/baseURL/attachments/ab/cd/ef/12/34/filename_a.ext)
![filename_b.ext](/baseURL/attachments/34/12/ef/cd/ab/filename_b.ext)`)

	assetURLs := extractAssetURLs(content)

	assert.Equal(t, []string{
		"/ab/cd/ef/12/34/filename_a.ext",
		"/34/12/ef/cd/ab/filename_b.ext",
	}, assetURLs)
}
