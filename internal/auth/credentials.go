package auth

import (
	"fmt"
	"log/slog"
)

type PlaintextPassword string

func (p *PlaintextPassword) String() string {
	return "[REDACTED PLAINTEXT PASSWORD]"
}

// LogValue implements the [slog.Valuer] interface.
func (p *PlaintextPassword) LogValue() slog.Value {
	return slog.StringValue(p.String())
}

// Format implements the [fmt.Formatter] interface.
func (p *PlaintextPassword) Format(f fmt.State, verb rune) {
	f.Write([]byte(p.String())) //nolint: errcheck // false can't check
}

// MarshalText implements the [encoding.TextMarshaler] interface.
// MarshalText is also be called by [json.Marshal] and [xml.Marshal].
func (p *PlaintextPassword) MarshalText() ([]byte, error) {
	return []byte(p.String()), nil
}
