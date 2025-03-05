package auth

import (
	"context"

	"go.robinthrift.com/belt/internal/domain"
)

type ctxAccountKeyType string

const ctxAccountKey = ctxAccountKeyType("ctxAccountKey")

func CtxWithAccount(ctx context.Context, a *domain.Account) context.Context {
	return context.WithValue(ctx, ctxAccountKey, a)
}

func AccountFromCtx(ctx context.Context) *domain.Account {
	val := ctx.Value(ctxAccountKey)
	a, ok := val.(*domain.Account)
	if !ok {
		return nil
	}

	return a
}
