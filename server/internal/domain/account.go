package domain

import (
	"errors"
	"strconv"
	"time"
)

var ErrAccountNotFound = errors.New("account not found")
var ErrInvalidAccountReference = errors.New("invalid account reference")
var ErrAccountKeyNotFound = errors.New("account key not found")

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
	return strconv.FormatInt(int64(id), 10)
}

const PrimaryAccountKeyName = "primary"

type AccountKeyID int64

type AccountKey struct {
	ID        AccountKeyID
	AccountID AccountID
	Name      string
	Type      string
	Data      []byte
}
