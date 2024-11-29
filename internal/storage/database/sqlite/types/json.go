package types

import (
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

type SQLiteJSON struct {
	Data any
	raw  []byte
}

func NewSQLiteJSON(data any) SQLiteJSON {
	return SQLiteJSON{Data: data}
}

var _ sql.Scanner = (*SQLiteJSON)(nil)
var _ driver.Valuer = (*SQLiteJSON)(nil)

func (sj *SQLiteJSON) Scan(src any) error {
	str, ok := src.(string)
	if !ok {
		return fmt.Errorf("invalid json type: expected string, got %T", src)
	}

	sj.raw = []byte(str)

	return nil
}

func (sj SQLiteJSON) Value() (driver.Value, error) {
	j, err := json.Marshal(sj.Data)
	return driver.Value(string(j)), err
}

func (sj SQLiteJSON) Unmarshal(t any) error {
	return json.Unmarshal(sj.raw, t)
}
