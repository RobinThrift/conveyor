package app

import (
	"go.robinthrift.com/belt/internal/jobs"
)

//nolint:gochecknoglobals
var jobFuncs = map[string]jobs.JobKindWithJSONData{}
