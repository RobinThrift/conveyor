package apiv1_test

import (
	"context"
	"fmt"
	"net/http/cookiejar"
	"testing"
	"time"

	"github.com/RobinThrift/belt/internal/ingress/apiv1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAPITokens_CRUD(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	client := setup(ctx, t)

	numTokens := 100

	for i := range numTokens {
		created, err := post[apiv1.CreateAPITokenRequest, apiv1.CreateAPIToken201JSONResponse](ctx, client, "/api/v1/apitokens", apiv1.CreateAPITokenRequest{
			Name:      fmt.Sprintf("%s_%d", t.Name(), i),
			ExpiresAt: time.Now().Add(time.Hour * 24),
		})
		require.NoError(t, err)
		assert.NotNil(t, created)
	}

	lastTokenID := "0"
	var lastTokenName string
	total := 0
	for i := 0; i < numTokens; i += 25 {
		list, err := get[apiv1.APITokenList](ctx, client, "/api/v1/apitokens", "page[size]", "25", "page[after]", lastTokenID)
		require.NoError(t, err, i)

		assert.Lenf(t, list.Items, 25, "i = %d", i)
		assert.NotEqualf(t, lastTokenName, list.Items[0].Name, "i = %d", i)
		lastTokenName = list.Items[len(list.Items)-1].Name
		if list.Next != nil {
			lastTokenID = *list.Next
		}
		total += len(list.Items)
	}

	assert.Equal(t, numTokens, total)

	for i := range 10 {
		err := del(ctx, client, fmt.Sprintf("/api/v1/apitokens/%s_%d", t.Name(), i))
		require.NoError(t, err)
	}

	for i := range 10 {
		_, err := get[apiv1.APIToken](ctx, client, fmt.Sprintf("/api/v1/apitokens/%s_%d", t.Name(), i))
		require.Error(t, err)
	}
}

func TestAPITokens_Usage(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	client := setup(ctx, t)

	created, err := post[apiv1.CreateAPITokenRequest, apiv1.CreateAPIToken201JSONResponse](ctx, client, "/api/v1/apitokens", apiv1.CreateAPITokenRequest{
		Name:      t.Name(),
		ExpiresAt: time.Now().Add(time.Hour * 24),
	})
	require.NoError(t, err)
	require.NotNil(t, created)

	client.c.Jar, err = cookiejar.New(nil)
	require.NoError(t, err)

	_, err = post[apiv1.CreateMemoRequest, apiv1.CreateMemo201JSONResponse](ctx, client, "/api/v1/memos", apiv1.CreateMemoRequest{
		Content: t.Name() + " Memo content",
	}, "Authorization", "Bearer "+created.Token)
	require.NoError(t, err)
}
