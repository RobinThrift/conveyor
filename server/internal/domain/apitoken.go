package domain

import (
	"errors"
	"time"
)

var ErrAPITokenNotFound = errors.New("api token not found")

type APITokenID int64

type APIToken struct {
	ID        APITokenID
	AccountID AccountID
	TokenID   int64
	Name      string
	CreatedAt time.Time
	ExpiresAt time.Time
}

type APITokenList struct {
	Items []*APIToken
	Next  *APITokenID
}

type ListAPITokenQuery struct {
	PageSize  uint64
	PageAfter *APITokenID
}
