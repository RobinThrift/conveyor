package auth

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"golang.org/x/crypto/argon2"
)

var ErrAPITokenNotFound = errors.New("api token not found")

type APIToken struct {
	AccountID AccountID
	Name      string
	Value     APITokenValue
	CreatedAt time.Time
	ExpiresAt time.Time
}

type APITokenList struct {
	Items []*APIToken
	Next  *int64
}

type ListAPITokenQuery struct {
	PageSize  uint64
	PageAfter *int64
}

type APITokenValue []byte

func (p *APITokenValue) String() string {
	return "[REDACTED API TOKEN VALUE]"
}

// LogValue implements the [slog.Valuer] interface.
func (p *APITokenValue) LogValue() slog.Value {
	return slog.StringValue(p.String())
}

// Format implements the [fmt.Formatter] interface.
func (p *APITokenValue) Format(f fmt.State, verb rune) {
	f.Write([]byte(p.String())) //nolint: errcheck // false can't check
}

// MarshalText implements the [encoding.TextMarshaler] interface.
// MarshalText is also be called by [json.Marshal] and [xml.Marshal].
func (p *APITokenValue) MarshalText() ([]byte, error) {
	return []byte(p.String()), nil
}

type APITokenValuePair struct {
	Plaintext APITokenValue
	Salt      []byte
}

func NewAPITokenValuePairFromEncoded(value []byte) (*APITokenValuePair, error) {
	parts := strings.SplitN(string(value), "$", 2)
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

	return &APITokenValuePair{
		Plaintext: APITokenValue(plaintext),
		Salt:      salt,
	}, nil
}

func NewAPITokenValuePair(tokenLen uint) (*APITokenValuePair, error) {
	plaintext := make([]byte, tokenLen)
	_, err := rand.Read(plaintext)
	if err != nil {
		return nil, fmt.Errorf("error generating random value for token: %w", err)
	}

	salt := make([]byte, 16)
	_, err = rand.Read(salt)
	if err != nil {
		return nil, fmt.Errorf("error generating random value for token salt: %w", err)
	}

	return &APITokenValuePair{
		Plaintext: plaintext,
		Salt:      salt,
	}, nil
}

func (p *APITokenValuePair) Encrypt(params Argon2Params) []byte {
	return argon2.IDKey(p.Plaintext, p.Salt, params.Time, params.Memory, params.Threads, params.KeyLen)
}

func (p *APITokenValuePair) String() string {
	salt := base64.URLEncoding.EncodeToString(p.Salt)
	value := base64.URLEncoding.EncodeToString(p.Plaintext)
	return salt + "$" + value
}
