package auth

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
	"time"

	"go.robinthrift.com/belt/internal/domain"
	"go.robinthrift.com/belt/internal/x/sensitive"
	"golang.org/x/crypto/argon2"
)

var ErrAuthTokenNotFound = errors.New("auth token not found")

type AuthTokenID int64

type AuthToken struct {
	ID        AuthTokenID
	AccountID domain.AccountID

	Value     AuthTokenValue
	ExpiresAt time.Time

	RefreshValue     AuthTokenValue
	RefreshExpiresAt time.Time

	CreatedAt time.Time
}

type AuthTokenValue = sensitive.Value

type PlaintextAuthToken struct {
	Plaintext PlaintextAuthTokenValue
	ExpiresAt time.Time

	RefreshPlaintext PlaintextAuthTokenValue
	RefreshExpiresAt time.Time
}

type PlaintextAuthTokenValue struct {
	sensitive.Value
	salt []byte
}

func NewPlaintextAuthTokenValueFromString(value string) (*PlaintextAuthTokenValue, error) {
	parts := strings.SplitN(value, "$", 2)
	if len(parts) != 2 {
		return nil, errors.New("invalid token format")
	}

	plaintext, err := base64.URLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("invalid token value: %w", err)
	}

	salt, err := base64.URLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, fmt.Errorf("invalid token salt: %w", err)
	}

	return &PlaintextAuthTokenValue{
		Value: plaintext,
		salt:  salt,
	}, nil
}

func NewPlaintextAuthToken(tokenLen uint, expiresAt time.Time, refreshExpiresAt time.Time) (*PlaintextAuthToken, error) {
	valueSalt := make([]byte, 16)
	_, err := rand.Read(valueSalt)
	if err != nil {
		return nil, fmt.Errorf("error generating random value for token salt: %w", err)

	}
	valuePlaintext := make([]byte, tokenLen)
	_, err = rand.Read(valuePlaintext)
	if err != nil {
		return nil, fmt.Errorf("error generating random value for token: %w", err)
	}

	refreshSalt := make([]byte, 16)
	_, err = rand.Read(refreshSalt)
	if err != nil {
		return nil, fmt.Errorf("error generating random value for refresh token salt: %w", err)
	}

	refreshPlaintext := make([]byte, tokenLen)
	_, err = rand.Read(refreshPlaintext)
	if err != nil {
		return nil, fmt.Errorf("error generating random value for refresh token: %w", err)
	}

	return &PlaintextAuthToken{
		Plaintext: PlaintextAuthTokenValue{
			Value: valuePlaintext,
			salt:  valueSalt,
		},
		ExpiresAt: expiresAt,
		RefreshPlaintext: PlaintextAuthTokenValue{
			Value: refreshPlaintext,
			salt:  refreshSalt,
		},
		RefreshExpiresAt: refreshExpiresAt,
	}, nil
}

func (v *PlaintextAuthTokenValue) Encrypt(params Argon2Params) []byte {
	return argon2.IDKey(v.Value, v.salt, params.Time, params.Memory, params.Threads, params.KeyLen)
}

func (v *PlaintextAuthTokenValue) Export() string {
	salt := base64.URLEncoding.EncodeToString(v.salt)
	value := base64.URLEncoding.EncodeToString(v.Value)
	return salt + "$" + value
}
