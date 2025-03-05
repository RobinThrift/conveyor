package sensitive

import (
	"fmt"
	"log/slog"
)

type Value []byte

func (p *Value) String() string {
	return "[REDACTED SENSITIVE VALUE]"
}

// LogValue implements the [slog.Valuer] interface.
func (p *Value) LogValue() slog.Value {
	return slog.StringValue(p.String())
}

// Format implements the [fmt.Formatter] interface.
func (p *Value) Format(f fmt.State, verb rune) {
	f.Write([]byte(p.String())) //nolint: errcheck // false can't check
}

// MarshalText implements the [encoding.TextMarshaler] interface.
// MarshalText is also be called by [json.Marshal] and [xml.Marshal].
func (p *Value) MarshalText() ([]byte, error) {
	return []byte(p.String()), nil
}
