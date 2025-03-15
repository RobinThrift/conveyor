package domain

import (
	"errors"
	"fmt"
	"time"
)

var ErrAccountNotFound = errors.New("account not found")

type AccountID int64

type Account struct {
	ID AccountID

	Username string

	Password AccountPassword

	CreatedAt time.Time
	UpdatedAt time.Time
}

type AccountPassword struct {
	Algorithm      string
	Params         string
	Password       []byte
	Salt           []byte
	RequiresChange bool
}

func (id AccountID) String() string {
	return fmt.Sprint(int64(id))
}

type AccountKeyID int64

type AccountKey struct {
	ID        AccountKeyID
	AccountID AccountID
	Name      string
	Type      string
	Data      []byte
}
