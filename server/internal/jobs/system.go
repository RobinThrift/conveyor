package jobs

import (
	"context"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"go.robinthrift.com/conveyor/internal/auth"
	"go.robinthrift.com/conveyor/internal/domain"
	"go.robinthrift.com/conveyor/internal/storage/database"
	"go.robinthrift.com/conveyor/internal/tracing"
)

type Scheduler interface {
	Schedule(ctx context.Context, job *domain.Job) error
}

type System struct {
	transactioner  database.Transactioner
	repo           SystemJobRepo
	accountFetcher SystemAccountFetcher
	now            SystemTimeNowFunc
	jobKinds       map[string]JobKindWithJSONData

	wakeup    chan struct{}
	timer     *time.Timer
	isRunning bool
	mu        sync.Mutex
}

type SystemTimeNowFunc func() time.Time

type SystemAccountFetcher interface {
	Get(ctx context.Context, id domain.AccountID) (*domain.Account, error)
}

type SystemJobRepo interface {
	ListNextJobs(ctx context.Context, scheduledFor time.Time) ([]*domain.Job, error)
	CreateJob(ctx context.Context, job *domain.Job) error
	UpdateJob(ctx context.Context, job *domain.Job) error
	GetNextWakeUpTime(ctx context.Context) (time.Time, error)
}

func NewSystem(transactioner database.Transactioner, repo SystemJobRepo, accountFetcher SystemAccountFetcher, nowFunc SystemTimeNowFunc, jobKinds map[string]JobKindWithJSONData) *System {
	return &System{
		transactioner:  transactioner,
		repo:           repo,
		accountFetcher: accountFetcher,
		now:            nowFunc,
		jobKinds:       jobKinds,
		wakeup:         make(chan struct{}, 1),
	}
}

func (s *System) Start(ctx context.Context) {
	slog.InfoContext(ctx, "starting job system")
	s.scheduleWakeup(ctx)

	for {
		select {
		case <-ctx.Done():
			slog.InfoContext(ctx, "stopping job system")

			return
		case <-s.wakeup:
			s.startJobExecution(ctx)
		}
	}
}

func (s *System) Schedule(ctx context.Context, job *domain.Job) error {
	account := auth.AccountFromCtx(ctx)
	if account == nil {
		return auth.ErrUnauthorized
	}

	job.State = domain.JobStateScheduled
	job.Result = nil

	if job.ScheduledFor.IsZero() {
		job.ScheduledFor = s.now()
	}

	err := s.repo.CreateJob(ctx, job)
	if err != nil {
		return err
	}

	if job.ScheduledFor.Sub(s.now()) <= time.Second {
		s.wakeup <- struct{}{}
	} else {
		s.scheduleWakeup(ctx)
	}

	return nil
}

func (s *System) scheduleWakeup(ctx context.Context) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.isRunning {
		return
	}

	next, err := s.repo.GetNextWakeUpTime(ctx)
	if err != nil {
		slog.ErrorContext(ctx, "error getting next wake-up time", slog.Any("error", err))

		return
	}

	if next.IsZero() {
		return
	}

	if s.timer != nil {
		s.timer.Stop()
	}

	s.timer = time.AfterFunc(next.Sub(s.now()), func() {
		s.wakeup <- struct{}{}
	})
}

const defaultJobExecutionTimeout = time.Minute * 10

func (s *System) startJobExecution(ctx context.Context) {
	s.mu.Lock()
	s.isRunning = true
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		s.isRunning = false
		s.mu.Unlock()
		s.scheduleWakeup(ctx)
	}()

	ctx, cancel := context.WithTimeout(ctx, defaultJobExecutionTimeout)
	defer cancel()

	err := s.transactioner.InTransaction(ctx, func(ctx context.Context) error {
		return s.execJobs(ctx)
	})
	if err != nil {
		slog.ErrorContext(ctx, "error executing jobs", slog.Any("error", err))
	}
}

func (s *System) execJobs(ctx context.Context) error {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	jobs, err := s.repo.ListNextJobs(ctx, s.now())
	if err != nil {
		return err
	}

	for _, job := range jobs {
		slog.InfoContext(ctx, "starting job", slog.String("job_name", job.Kind), slog.Int64("job_id", job.ID))

		result, err := s.execJob(ctx, job)
		if err != nil {
			slog.ErrorContext(ctx, "error executing job", slog.String("job_name", job.Kind), slog.Int64("job_id", job.ID), slog.Any("error", err))
			job.State = domain.JobStateError
			job.Result = &domain.JobResult{Message: err.Error()}
		} else {
			job.Result = result
		}

		err = s.repo.UpdateJob(ctx, job)
		if err != nil {
			slog.ErrorContext(ctx, "error updating job", slog.String("job_name", job.Kind), slog.Int64("job_id", job.ID), slog.Any("error", err))
		}
	}

	return nil
}

func (s *System) execJob(ctx context.Context, job *domain.Job) (*domain.JobResult, error) {
	kind, ok := s.jobKinds[job.Kind]
	if !ok {
		return nil, fmt.Errorf("%w: %s", ErrUnknownJobKind, job.Kind)
	}

	ctx = tracing.RequestIDWithCtx(ctx, tracing.NewRequestID())

	ctx = auth.CtxWithAccount(ctx, &domain.Account{})

	return kind.Exec(ctx, job.Data.([]byte)) //nolint:forcetypeassert // @TODO: This should probably be fixed
}
