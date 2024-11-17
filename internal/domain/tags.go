package domain

import (
	"errors"
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
