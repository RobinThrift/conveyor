package types

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestPrepareFTSQueryString(t *testing.T) {
	tt := []struct {
		name     string
		input    string
		expected string
	}{
		{name: "Empty String", input: "", expected: ""},
		{name: "Wrap all bare in quotes", input: "One Two Three", expected: `"One Two Three"`},
		{name: "Ignore quoted strings", input: `One "Two Three" Four`, expected: `"One" "Two Three" "Four"`},
		{name: "Ignore AND", input: `One AND Three`, expected: `"One" and "Three"`},
		{name: "Ignore OR", input: `One OR Three`, expected: `"One" or "Three"`},
		{name: "Ignore NOT", input: `One NOT Two`, expected: `"One" not "Two"`},
		{name: "Ignore +", input: `One + Three`, expected: `"One" + "Three"`},
		{name: "Ignore *", input: `One Two*`, expected: `"One Two"*`},
		{name: "Special Chars With Prefix", input: `# Test Memo 1*`, expected: `"# Test Memo 1"*`},
		{name: "Non ASCII", input: `# Übersicht der Änderungen`, expected: `"# Übersicht der Änderungen"`},
	}

	for _, tt := range tt {
		t.Run(tt.name, func(t *testing.T) {
			actual := PrepareFTSQueryString(tt.input)
			assert.Equal(t, tt.expected, actual, tt.input)
		})
	}
}
