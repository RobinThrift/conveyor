package jobs_test

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.robinthrift.com/belt/internal/auth"
	"go.robinthrift.com/belt/internal/control"
	"go.robinthrift.com/belt/internal/domain"
	"go.robinthrift.com/belt/internal/jobs"
	"go.robinthrift.com/belt/internal/storage/database/sqlite"
	"go.robinthrift.com/belt/internal/testhelper"
)

func TestSystem_Schedule_Now(t *testing.T) {
	t.Parallel()

	ctx := auth.CtxWithAccount(t.Context(), &domain.Account{ID: 1})

	type jobData struct{ Foo string }

	jobChan := make(chan jobData, 1)

	system := setupJobSystem(t, time.Now, map[string]jobs.JobKindWithJSONData{
		t.Name(): jobs.NewJobKindWithJSONData(jobKindFunc[jobData](func(_ context.Context, data jobData) (*domain.JobResult, error) {
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

	ctx, cancel := context.WithTimeout(ctx, time.Second)
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

	ctx := auth.CtxWithAccount(t.Context(), &domain.Account{ID: 1})

	type jobData struct{ Foo string }

	jobChan := make(chan jobData, 1)

	system := setupJobSystem(t, time.Now, map[string]jobs.JobKindWithJSONData{
		t.Name(): jobs.NewJobKindWithJSONData(jobKindFunc[jobData](func(_ context.Context, data jobData) (*domain.JobResult, error) {
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

	ctx, cancel := context.WithTimeout(ctx, time.Second)
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

	ctx := auth.CtxWithAccount(t.Context(), &domain.Account{ID: 1})

	type jobData struct{ Foo string }

	jobChan := make(chan jobData, 1)

	timeNow := time.Now()
	timeNowFunc := func() time.Time {
		return timeNow
	}

	system := setupJobSystem(t, timeNowFunc, map[string]jobs.JobKindWithJSONData{
		t.Name(): jobs.NewJobKindWithJSONData(jobKindFunc[jobData](func(_ context.Context, data jobData) (*domain.JobResult, error) {
			jobChan <- data

			return &domain.JobResult{Message: "Done " + data.Foo}, nil
		})),
		"trigger": jobs.NewJobKindWithJSONData(jobKindFunc[jobData](func(_ context.Context, _ jobData) (*domain.JobResult, error) {
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

	ctx, cancel := context.WithTimeout(ctx, time.Second)
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

	ctx := auth.CtxWithAccount(t.Context(), &domain.Account{ID: 1})

	type jobData struct{ Foo string }

	jobChan := make(chan jobData, 1)

	system := setupJobSystem(t, time.Now, map[string]jobs.JobKindWithJSONData{
		t.Name(): jobs.NewJobKindWithJSONData(jobKindFunc[jobData](func(_ context.Context, data jobData) (*domain.JobResult, error) {
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
	ctx, cancel := context.WithTimeout(ctx, time.Second*10)
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

func setupJobSystem(t *testing.T, timeNow jobs.SystemTimeNowFunc, jobFuncs map[string]jobs.JobKindWithJSONData) *jobs.System {
	t.Helper()

	db := testhelper.NewFileTestSQLite(t)

	accountRepo := sqlite.NewAccountRepo(db)
	jobRepo := sqlite.NewJobRepo(db)
	authTokenRepo := sqlite.NewAuthTokenRepo(db)

	config := control.AuthConfig{
		Argon2Params:              auth.Argon2Params{KeyLen: 32, Memory: 8192, Threads: 2, Time: 1},
		AuthTokenLength:           32,
		AccessTokenValidDuration:  time.Hour,
		RefreshTokenValidDuration: time.Hour * 2,
	}

	authCtrl := control.NewAuthController(config, db, control.NewAccountController(db, accountRepo), authTokenRepo)

	err := authCtrl.CreateAccount(t.Context(), control.CreateAccountCmd{
		Account: &domain.Account{
			Username: t.Name(),
		},
		PlaintextPasswd: auth.PlaintextPassword(t.Name()),
	})
	if err != nil {
		t.Fatal(err)
	}

	return jobs.NewSystem(db, jobRepo, control.NewAccountController(db, accountRepo), timeNow, jobFuncs)
}

type jobKindFunc[T any] func(ctx context.Context, data T) (*domain.JobResult, error)

func (fn jobKindFunc[T]) Exec(ctx context.Context, data T) (*domain.JobResult, error) {
	return fn(ctx, data)
}
