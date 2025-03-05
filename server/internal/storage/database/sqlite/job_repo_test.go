package sqlite

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.robinthrift.com/belt/internal/domain"
)

func TestJobRepo_CRUD(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	repo := setupJobRepo(ctx, t)

	type jobdata struct{ Param string }

	numJobs := 10
	now := time.Now().UTC().Round(time.Second)
	scheduleFor := now.Add(-time.Second * time.Duration(numJobs/2))

	for i := 0; i < numJobs; i++ {
		scheduleFor = scheduleFor.Add(time.Second)
		err := repo.CreateJob(ctx, &domain.Job{
			State:        domain.JobStateScheduled,
			Kind:         fmt.Sprintf("job-%d", i),
			Data:         jobdata{Param: fmt.Sprintf("param for job-%d", i)},
			ScheduledFor: scheduleFor,
		})
		require.NoError(t, err)
	}

	// List half the jobs that are before "now"
	jobs, err := repo.ListNextJobs(ctx, now)
	require.NoError(t, err)
	assert.Len(t, jobs, numJobs/2)

	for _, j := range jobs {
		assert.GreaterOrEqual(t, now, j.ScheduledFor)
	}

	// List all Jobs
	now = now.Add(time.Second * 10)
	jobs, err = repo.ListNextJobs(ctx, now)
	require.NoError(t, err)
	assert.Len(t, jobs, numJobs)

	for _, j := range jobs {
		assert.GreaterOrEqual(t, now, j.ScheduledFor)
	}

	// Mark all jobs as done
	for i, j := range jobs {
		j.Result = &domain.JobResult{Message: fmt.Sprintf("job %d done", i)}
		j.State = domain.JobStateDone
		err = repo.UpdateJob(ctx, j)
		require.NoError(t, err)
	}

	// List all Jobs again, as they are all marked as "done" now, the list should be empty
	jobs, err = repo.ListNextJobs(ctx, now)
	require.NoError(t, err)
	assert.Len(t, jobs, 0)
}

func TestJobRepo_GetNextWakeUpTime(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	repo := setupJobRepo(ctx, t)

	numJobs := 10
	now := time.Now().UTC().Round(time.Second)
	scheduleFor := now.Add(-time.Second * time.Duration(numJobs/2))

	for i := 0; i < numJobs; i++ {
		scheduleFor = scheduleFor.Add(time.Second)
		err := repo.CreateJob(ctx, &domain.Job{
			State:        domain.JobStateScheduled,
			Kind:         fmt.Sprintf("job-%d", i),
			ScheduledFor: scheduleFor,
		})
		require.NoError(t, err)
	}

	next, err := repo.GetNextWakeUpTime(ctx)
	require.NoError(t, err)
	assert.Equal(t, now.Add(time.Second*time.Duration(numJobs/2)), next)
}

func setupJobRepo(ctx context.Context, t *testing.T) *JobRepo {
	t.Helper()
	db := newTestDB(ctx, t)

	accountRepo := NewAccountRepo(db)

	err := accountRepo.Create(ctx, &domain.Account{Username: t.Name(), Password: domain.AccountPassword{Password: []byte("1234"), Salt: []byte("1234")}})
	if err != nil {
		t.Fatal(err)
	}

	return NewJobRepo(db)
}
