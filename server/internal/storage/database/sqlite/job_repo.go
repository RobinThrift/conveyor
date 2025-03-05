package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"go.robinthrift.com/belt/internal/domain"
	"go.robinthrift.com/belt/internal/storage/database"
	"go.robinthrift.com/belt/internal/storage/database/sqlite/sqlc"
	"go.robinthrift.com/belt/internal/storage/database/sqlite/types"
)

type JobRepo struct {
	db database.Database
}

func NewJobRepo(db database.Database) *JobRepo {
	return &JobRepo{db}
}

func (r *JobRepo) GetNextWakeUpTime(ctx context.Context) (time.Time, error) {
	wakeup, err := queries.GetNextWakeUpTime(ctx, r.db.Conn(ctx))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return time.Time{}, nil
		}
		return time.Time{}, fmt.Errorf("error getting next wakeup time: %w", err)
	}

	return wakeup.Time, nil
}

func (r *JobRepo) ListNextJobs(ctx context.Context, scheduledFor time.Time) ([]*domain.Job, error) {
	res, err := queries.ListNextJobs(ctx, r.db.Conn(ctx), types.NewSQLiteDatetime(scheduledFor).String())
	if err != nil {
		return nil, fmt.Errorf("error listing next jobs: %w", err)
	}

	list := make([]*domain.Job, 0, len(res))
	for _, j := range res {
		list = append(list, &domain.Job{
			ID:           j.ID,
			State:        domain.JobState(j.State.(string)),
			Kind:         j.Kind,
			Data:         j.Data.Raw,
			ScheduledFor: j.ScheduledFor.Time,
		})
	}

	return list, nil
}

func (r *JobRepo) CreateJob(ctx context.Context, job *domain.Job) error {
	err := queries.CreateJob(ctx, r.db.Conn(ctx), sqlc.CreateJobParams{
		Kind:         job.Kind,
		Data:         types.NewSQLiteJSON(job.Data),
		ScheduledFor: types.NewSQLiteDatetime(job.ScheduledFor),
	})
	if err != nil {
		return fmt.Errorf("error creating job: %w", err)
	}

	return nil
}

func (r *JobRepo) UpdateJob(ctx context.Context, job *domain.Job) error {
	err := queries.UpdateJob(ctx, r.db.Conn(ctx), sqlc.UpdateJobParams{
		ID:         job.ID,
		State:      job.State,
		Result:     types.NewSQLiteJSON(&job.Result),
		FinishedAt: types.NewSQLiteDatetime(time.Now()),
	})
	if err != nil {
		return fmt.Errorf("error updating job: %w", err)
	}

	return nil
}
