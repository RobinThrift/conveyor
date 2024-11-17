package auth

import "context"

type ctxAccountKeyType string

const ctxAccountKey = ctxAccountKeyType("ctxAccountKey")

func CtxWithAccount(ctx context.Context, a *Account) context.Context {
	return context.WithValue(ctx, ctxAccountKey, a)
}

func AccountFromCtx(ctx context.Context) *Account {
	val := ctx.Value(ctxAccountKey)
	a, ok := val.(*Account)
	if !ok {
		return nil
	}

	return a
}
