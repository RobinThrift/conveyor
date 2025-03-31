package app

import (
	"go.robinthrift.com/conveyor/internal/jobs"
)

//nolint:gochecknoglobals
var jobFuncs = map[string]jobs.JobKindWithJSONData{}
