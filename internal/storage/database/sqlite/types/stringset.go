package types

import (
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

var marker = struct{}{}

type SQLiteStringSet struct {
	entries map[string]struct{}
}

func NewSQLiteStringSet(strs []string) SQLiteStringSet {
	entries := make(map[string]struct{}, len(strs))
	for _, str := range strs {
		entries[str] = marker
	}

	return SQLiteStringSet{entries}
}

var _ sql.Scanner = (*SQLiteStringSet)(nil)
var _ driver.Valuer = (*SQLiteStringSet)(nil)

func (s *SQLiteStringSet) Scan(src any) error {
	str, ok := src.(string)
	if !ok {
		return fmt.Errorf("invalid input type for converting SQLiteStringSet from json: %T", src)
	}

	var values []string
	err := json.Unmarshal([]byte(str), &values)
	if err != nil {
		return fmt.Errorf("error unmarshalling SQLiteStringSet from json: %w", err)
	}

	s.entries = make(map[string]struct{}, len(values))
	for _, str := range values {
		s.entries[str] = marker
	}

	return nil
}

func (s SQLiteStringSet) Value() (driver.Value, error) {
	vals := make([]string, 0, len(s.entries))

	for k := range s.entries {
		vals = append(vals, k)
	}

	j, err := json.Marshal(vals)
	return driver.Value(string(j)), err
}
