package domain

import (
	"errors"
	"time"

	"github.com/RobinThrift/belt/internal/auth"
)

var ErrCreateMemo = errors.New("error creating memo")
var ErrMemoNotFound = errors.New("memo not found")

type MemoID int64

type Memo struct {
	ID         MemoID
	Name       string
	Content    []byte
	IsArchived bool
	CreatedBy  auth.AccountID
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

type MemoList struct {
	Items []*Memo
	Next  *MemoID
}
