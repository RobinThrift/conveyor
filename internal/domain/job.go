package domain

import (
	"time"

	"github.com/RobinThrift/belt/internal/auth"
)

type JobState string

const (
	JobStateScheduled JobState = "scheduled"
	JobStateDone      JobState = "done"
	JobStateError     JobState = "error"
)

type Job struct {
	ID           int64
	CreatedBy    auth.AccountID
	State        JobState
	Kind         string
	Data         any
	Result       *JobResult
	ScheduledFor time.Time
}

type JobResult struct {
	Message string
}
