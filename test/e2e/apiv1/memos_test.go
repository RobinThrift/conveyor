package apiv1_test

import (
	"context"
	"fmt"
	"testing"

	"github.com/RobinThrift/belt/internal/ingress/apiv1"
	"github.com/stretchr/testify/require"
)

func TestMemos(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	client := setup(ctx, t)
	fmt.Printf("client %#v\n", client)

	memos, err := get[apiv1.MemoList](ctx, client, "/api/v1/memos", "page[size]", "10")
	require.NoError(t, err)
	require.NotNil(t, memos)
}
