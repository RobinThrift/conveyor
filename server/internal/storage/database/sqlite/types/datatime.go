package types

import (
	"database/sql"
	"database/sql/driver"
	"fmt"
	"strings"
	"time"
)

// SQLiteDatetime offers interoperability between SQLite's lack of Datetime types and go's time.Time.
// Inspired by github.com/mattn/go-sqlite3.
type SQLiteDatetime struct { //nolint:recvcheck // receiver types are chosen intentionally
	Time  time.Time
	Valid bool
}

func NewSQLiteDatetime(t time.Time) SQLiteDatetime {
	return SQLiteDatetime{Time: t, Valid: !t.IsZero()}
}

var _ sql.Scanner = (*SQLiteDatetime)(nil)
var _ driver.Valuer = (*SQLiteDatetime)(nil)

//nolint:gochecknoglobals
var sqliteTimestampFormat = "2006-01-02 15:04:05"

func (sdt SQLiteDatetime) String() string {
	return sdt.Time.UTC().Format(sqliteTimestampFormat) + "Z"
}

func (sdt *SQLiteDatetime) Scan(src any) error {
	if src == nil {
		return nil
	}

	str, ok := src.(string)
	if !ok {
		return fmt.Errorf("invalid input type for converting to time %T", src) //nolint:err113
	}

	if str == "" {
		return nil
	}

	str = strings.TrimSuffix(str, "Z")

	parsed, err := time.ParseInLocation(sqliteTimestampFormat, str, time.UTC)
	if err != nil {
		return fmt.Errorf("error converting '%s' to time.Time", str) //nolint:err113
	}

	sdt.Valid = !parsed.IsZero()
	sdt.Time = parsed.UTC()

	return nil
}

func (sdt SQLiteDatetime) Value() (driver.Value, error) {
	return driver.Value(sdt.Time.UTC().Format(sqliteTimestampFormat) + "Z"), nil
}
