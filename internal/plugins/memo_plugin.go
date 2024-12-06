package plugins

import (
	"context"

	"github.com/RobinThrift/belt/internal/domain"
)

// A MemoContentPlugin is called before the Memo is saved. Any plugin wishing to edit the content and
// that doesn't require access to the Memo's ID should implement this type.
// When a new Memo is created, the Memo's ID might not be valid yet.
type MemoContentPlugin interface {
	Plugin
	MemoContentPlugin(ctx context.Context, content []byte) ([]byte, error)
}

// MemoPluginSaved hooked plugins are called after the Memo has been saved and is assigned a valid ID.
// Changes to any of passed Memo's fields will have not effect.
type MemoSavedPlugin interface {
	Plugin
	MemoSavedPlugin(ctx context.Context, memo *domain.Memo) error
}
