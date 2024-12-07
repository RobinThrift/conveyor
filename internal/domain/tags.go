package domain

import (
	"errors"
	"regexp"
	"time"
)

var ErrCreateTag = errors.New("error creating tag")
var ErrTagNotFound = errors.New("tag not found")

type Tag struct {
	Tag       string
	Count     int64
	UpdatedAt time.Time
}

type TagList struct {
	Items []*Tag
	Next  *string
}

var tagPattern = regexp.MustCompile(`(?m)(:?^|[ \t])#([\pL\pN/\-_]+)`)

func ExtractTags(content []byte) []string {
	var tags []string //nolint: prealloc // false positive

	blocks := splitByCodeBlocks(content)

	for _, block := range blocks {
		foundTags := tagPattern.FindAllSubmatch(block, -1)
		for _, tag := range foundTags {
			if len(tag) == 0 || len(tag[2]) == 0 {
				continue
			}
			tags = append(tags, string(tag[2]))
		}
	}

	return tags
}

var codeBlockPattern = regexp.MustCompile("```[\\w]*")

func splitByCodeBlocks(content []byte) [][]byte {
	codeBlockPos := codeBlockPattern.FindAllIndex(content, -1)

	if len(codeBlockPos) == 0 {
		return [][]byte{content}
	}

	blocks := make([][]byte, 0, len(codeBlockPos))

	start := 0
	end := 0
	for i, f := range codeBlockPos {
		if i%2 == 0 {
			end = f[0]
			blocks = append(blocks, content[start:end])
			start = f[1]
		}
	}

	return blocks
}
