package httperrors

import (
	"fmt"
)

// Error Follows RFC7807 (https://datatracker.ietf.org/doc/html/rfc7807)
type Error struct {
	Code   int    `json:"code"`
	Detail string `json:"detail"`
	Title  string `json:"title"`
	Type   string `json:"type"`
}

func (e *Error) Error() string {
	return fmt.Sprintf("%s (%d): %s %s", e.Type, e.Code, e.Title, e.Detail)
}
