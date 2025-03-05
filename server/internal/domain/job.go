package domain

import (
	"time"
)

type JobState string

const (
	JobStateScheduled JobState = "scheduled"
	JobStateDone      JobState = "done"
	JobStateError     JobState = "error"
)

type Job struct {
	ID           int64
	State        JobState
	Kind         string
	Data         any
	Result       *JobResult
	ScheduledFor time.Time
}

type JobResult struct {
	Message string
}
