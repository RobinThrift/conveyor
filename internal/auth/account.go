package auth

import (
	"errors"
	"time"
)

var ErrAccountNotFound = errors.New("account not found")

type AccountID int64

type Account struct {
	ID       AccountID
	Username string

	DisplayName string
	IsAdmin     bool

	RequiresPasswordChange bool

	AuthRef string

	CreatedAt time.Time
	UpdatedAt time.Time
}
