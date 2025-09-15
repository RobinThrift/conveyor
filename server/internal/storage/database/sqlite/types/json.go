package types //nolint:revive // package nesting makes the usage/naming clear

import (
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

type SQLiteJSON struct { //nolint:recvcheck // receiver types are chosen intentionally
	Data any
	Raw  []byte
}

func NewSQLiteJSON(data any) SQLiteJSON {
	return SQLiteJSON{Data: data}
}

var _ sql.Scanner = (*SQLiteJSON)(nil)
var _ driver.Valuer = (*SQLiteJSON)(nil)

func (sj *SQLiteJSON) Scan(src any) error {
	if src == nil {
		return nil
	}

	str, ok := src.(string)
	if !ok {
		return fmt.Errorf("invalid json type: expected string, got %T", src) //nolint:err113
	}

	sj.Raw = []byte(str)

	return nil
}

func (sj SQLiteJSON) Value() (driver.Value, error) {
	j, err := json.Marshal(sj.Data)

	return driver.Value(string(j)), err
}

func (sj SQLiteJSON) Unmarshal(t any) error {
	return json.Unmarshal(sj.Raw, t)
}
