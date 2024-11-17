package domain

import (
	"errors"
	"fmt"
	"time"

	"github.com/RobinThrift/belt/internal/auth"
)

var ErrCreateMemo = errors.New("error creating memo")
var ErrMemoNotFound = errors.New("memo not found")

type MemoID int64

type Memo struct {
	ID         MemoID
	Content    []byte
	IsArchived bool
	CreatedBy  auth.AccountID
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

type MemoList struct {
	Items []*Memo
	Next  *time.Time
}

func (id MemoID) String() string {
	return fmt.Sprint(int64(id))
}
