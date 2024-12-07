package domain

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestExtractTags(t *testing.T) {
	tt := []struct {
		name  string
		input string
		exp   []string
	}{
		{name: "Empty String"},
		{name: "Tag Only", input: "#tag-a", exp: []string{"tag-a"}},
		{name: "Unicode Char", input: "#täg-ü", exp: []string{"täg-ü"}},
		{name: "Mixed Case", input: "#Tag/Foo", exp: []string{"Tag/Foo"}},
		{name: "Tag with Number", input: "#tag-23281311 #342312", exp: []string{"tag-23281311", "342312"}},
		{
			name:  "Text with Inline Tags",
			input: "Testing inline #tag-b within a text #tag-c. This should be#ignored",
			exp:   []string{"tag-b", "tag-c"},
		},
		{
			name: "Tags on new Line",
			input: `# Heading
First line content
#tag-d #tag-e

Some more content
	#tag-f
`,
			exp: []string{"tag-d", "tag-e", "tag-f"},
		},
		{
			name: "Ingnore Markdown Headings",
			input: `# Heading 1
Content line 1

## Heading 2
Content line 2

### Heading 3
Content line 3
`,
		},
		{
			name: "Ignore # in URL",
			input: `https://www.w3.org/TR/wot-thing-description/#sec-core-vocabulary-definition
		https://www.w3.org/TR/json-ld11/#expanded-document-form`,
		},

		{
			name: "Ignore # in Code Blocks",
			input: `# Code Block Test

` + "```bash" + `
#!/bin/bash

# comment
echo "# testing"

#this-should be ignored, #and-this-too
` + "```" + `
`,
		},
	}

	for _, tt := range tt {
		t.Run(tt.name, func(t *testing.T) {
			found := ExtractTags([]byte(tt.input))
			assert.Equal(t, tt.exp, found)
		})
	}
}
