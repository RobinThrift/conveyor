package jobs_test

import (
	"context"
	"testing"
	"time"

	"github.com/RobinThrift/belt/internal/auth"
	"github.com/RobinThrift/belt/internal/control"
	"github.com/RobinThrift/belt/internal/domain"
	"github.com/RobinThrift/belt/internal/jobs"
	"github.com/RobinThrift/belt/internal/storage/database/sqlite"
	"github.com/RobinThrift/belt/internal/testhelper"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSystem_Schedule_Now(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	ctx = auth.CtxWithAccount(ctx, &auth.Account{ID: 1})

	type jobData struct{ Foo string }
	jobChan := make(chan jobData, 1)

	system := setupJobSystem(ctx, t, time.Now, map[string]jobs.JobKindWithJSONData{
		t.Name(): jobs.NewJobKindWithJSONData(jobKindFunc[jobData](func(ctx context.Context, data jobData) (*domain.JobResult, error) {
			jobChan <- data
			return &domain.JobResult{Message: "Done " + data.Foo}, nil
		})),
	})
	go system.Start(ctx)

	err := system.Schedule(ctx, &domain.Job{
		Kind: t.Name(),
		Data: &jobData{Foo: "Bar"},
	})
	require.NoError(t, err)

	ctx, cancel = context.WithTimeout(ctx, time.Second)
	t.Cleanup(cancel)

	select {
	case <-ctx.Done():
		t.Error(ctx.Err())
	case data := <-jobChan:
		assert.Equal(t, "Bar", data.Foo)
	}
}

func TestSystem_Schedule_Past(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	ctx = auth.CtxWithAccount(ctx, &auth.Account{ID: 1})

	type jobData struct{ Foo string }
	jobChan := make(chan jobData, 1)

	system := setupJobSystem(ctx, t, time.Now, map[string]jobs.JobKindWithJSONData{
		t.Name(): jobs.NewJobKindWithJSONData(jobKindFunc[jobData](func(ctx context.Context, data jobData) (*domain.JobResult, error) {
			jobChan <- data
			return &domain.JobResult{Message: "Done " + data.Foo}, nil
		})),
	})
	go system.Start(ctx)

	err := system.Schedule(ctx, &domain.Job{
		Kind:         t.Name(),
		Data:         &jobData{Foo: "Bar"},
		ScheduledFor: time.Now().Add(-time.Hour * 5),
	})
	require.NoError(t, err)

	ctx, cancel = context.WithTimeout(ctx, time.Second)
	t.Cleanup(cancel)

	select {
	case <-ctx.Done():
		t.Error(ctx.Err())
	case data := <-jobChan:
		assert.Equal(t, "Bar", data.Foo)
	}
}

func TestSystem_Schedule_Future(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	ctx = auth.CtxWithAccount(ctx, &auth.Account{ID: 1})

	type jobData struct{ Foo string }
	jobChan := make(chan jobData, 1)

	timeNow := time.Now()
	timeNowFunc := func() time.Time {
		return timeNow
	}

	system := setupJobSystem(ctx, t, timeNowFunc, map[string]jobs.JobKindWithJSONData{
		t.Name(): jobs.NewJobKindWithJSONData(jobKindFunc[jobData](func(ctx context.Context, data jobData) (*domain.JobResult, error) {
			jobChan <- data
			return &domain.JobResult{Message: "Done " + data.Foo}, nil
		})),
		"trigger": jobs.NewJobKindWithJSONData(jobKindFunc[jobData](func(ctx context.Context, data jobData) (*domain.JobResult, error) {
			return &domain.JobResult{}, nil
		})),
	})
	go system.Start(ctx)

	// Schedule job for 5 hours from now
	err := system.Schedule(ctx, &domain.Job{
		Kind:         t.Name(),
		Data:         &jobData{Foo: "Bar"},
		ScheduledFor: time.Now().Add(time.Hour * 5),
	})
	require.NoError(t, err)

	// Ensure the job wasn't run immediately
	oneSecTimeoutCtx, oneSecTimeoutCtxCancel := context.WithTimeout(ctx, time.Second)
	t.Cleanup(oneSecTimeoutCtxCancel)

	select {
	case <-oneSecTimeoutCtx.Done():
	case <-jobChan:
		t.Error("unexpected running of job")
	}

	// Fast forward the time by 12 hours
	timeNow = timeNow.Add(time.Hour * 12)

	// Schedule another job to trigger the wakup
	err = system.Schedule(ctx, &domain.Job{
		Kind: "trigger",
		Data: nil,
	})
	require.NoError(t, err)

	ctx, cancel = context.WithTimeout(ctx, time.Second)
	t.Cleanup(cancel)

	select {
	case <-ctx.Done():
		t.Error(ctx.Err())
	case data := <-jobChan:
		assert.Equal(t, "Bar", data.Foo)
	}
}

func TestSystem_Scheduled_Wakeup(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	ctx = auth.CtxWithAccount(ctx, &auth.Account{ID: 1})

	type jobData struct{ Foo string }
	jobChan := make(chan jobData, 1)

	system := setupJobSystem(ctx, t, time.Now, map[string]jobs.JobKindWithJSONData{
		t.Name(): jobs.NewJobKindWithJSONData(jobKindFunc[jobData](func(ctx context.Context, data jobData) (*domain.JobResult, error) {
			jobChan <- data
			return &domain.JobResult{Message: "Done " + data.Foo}, nil
		})),
	})
	go system.Start(ctx)

	// Schedule job for 5 seconds from now
	scheduledFor := time.Now().Round(time.Second).Add(time.Second * 5).UTC()
	err := system.Schedule(ctx, &domain.Job{
		Kind:         t.Name(),
		Data:         &jobData{Foo: "Bar"},
		ScheduledFor: scheduledFor,
	})
	require.NoError(t, err)

	// Ensure the job wasn't run immediately
	oneSecTimeoutCtx, oneSecTimeoutCtxCancel := context.WithTimeout(ctx, time.Second)
	t.Cleanup(oneSecTimeoutCtxCancel)

	select {
	case <-oneSecTimeoutCtx.Done():
	case <-jobChan:
		t.Error("unexpected running of job")
	}

	// set timeout to 10s to allow for wakeup
	ctx, cancel = context.WithTimeout(ctx, time.Second*10)
	t.Cleanup(cancel)

	select {
	case <-ctx.Done():
		t.Error(ctx.Err())
	case data := <-jobChan:
		assert.Equal(t, "Bar", data.Foo)
	}

	now := time.Now().UTC().Round(time.Second)
	assert.WithinRange(t, now, scheduledFor.Add(-time.Millisecond), scheduledFor.Add(time.Second*10))
}

func setupJobSystem(ctx context.Context, t *testing.T, timeNow jobs.SystemTimeNowFunc, jobFuncs map[string]jobs.JobKindWithJSONData) *jobs.System {
	t.Helper()

	db := testhelper.NewFileTestSQLite(ctx, t)

	accountRepo := sqlite.NewAccountRepo(db)
	jobRepo := sqlite.NewJobRepo(db)

	err := accountRepo.Create(ctx, &auth.Account{Username: t.Name(), DisplayName: t.Name(), IsAdmin: true})
	if err != nil {
		t.Fatal(err)
	}

	return jobs.NewSystem(db, jobRepo, control.NewAccountController(db, accountRepo), timeNow, jobFuncs)
}

type jobKindFunc[T any] func(ctx context.Context, data T) (*domain.JobResult, error)

func (fn jobKindFunc[T]) Exec(ctx context.Context, data T) (*domain.JobResult, error) {
	return fn(ctx, data)
}
