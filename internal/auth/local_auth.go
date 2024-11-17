package auth

import (
	"errors"
	"time"
)

var ErrLocalAuthAccountNotFound = errors.New("account for local auth not found")

type LocalAuthAccount struct {
	ID                     int64
	Username               string
	Algorithm              string
	Params                 string
	Salt                   []byte
	Password               []byte
	RequiresPasswordChange bool
	CreatedAt              time.Time
	UpdatedAt              time.Time
}
