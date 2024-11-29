// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.27.0

package sqlc

import (
	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/domain"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite/types"
)

type Account struct {
	ID          int64
	Username    string
	DisplayName string
	IsAdmin     bool
	AuthRef     string
	CreatedAt   types.SQLiteDatetime
	UpdatedAt   types.SQLiteDatetime
}

type Attachment struct {
	ID               domain.AttachmentID
	Filepath         string
	OriginalFilename string
	ContentType      string
	SizeBytes        int64
	Sha256           []byte
	CreatedBy        auth.AccountID
	CreatedAt        types.SQLiteDatetime
}

type LocalAuthAccount struct {
	ID                     int64
	Username               string
	Algorithm              string
	Params                 string
	Salt                   []byte
	Password               []byte
	RequiresPasswordChange bool
	CreatedAt              types.SQLiteDatetime
	UpdatedAt              types.SQLiteDatetime
}

type Memo struct {
	ID         domain.MemoID
	Content    []byte
	IsArchived bool
	IsDeleted  bool
	CreatedBy  auth.AccountID
	CreatedAt  types.SQLiteDatetime
	UpdatedAt  types.SQLiteDatetime
}

type MemoFTS struct {
	ID         domain.MemoID
	Content    []byte
	IsArchived bool
	IsDeleted  bool
	CreatedBy  auth.AccountID
	CreatedAt  types.SQLiteDatetime
	UpdatedAt  types.SQLiteDatetime
}

type Session struct {
	ID        int64
	Token     string
	Data      []byte
	ExpiresAt types.SQLiteDatetime
}

type Setting struct {
	ID        int64
	AccountID int64
	Key       string
	Value     types.SQLiteJSON
	CreatedAt string
	UpdatedAt string
}

type Tag struct {
	ID        int64
	Tag       string
	Count     int64
	CreatedBy int64
	CreatedAt types.SQLiteDatetime
	UpdatedAt types.SQLiteDatetime
}
