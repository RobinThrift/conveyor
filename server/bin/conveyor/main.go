package main

import (
	"context"
	"errors"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.robinthrift.com/conveyor/internal/app"
	"go.robinthrift.com/conveyor/internal/logging"
	"go.robinthrift.com/conveyor/internal/tracing"
)

func main() {
	err := run(context.Background())
	if err != nil {
		panic(err)
	}
}

func run(ctx context.Context) error {
	startCtx, startCtxCancel := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
	defer startCtxCancel()

	config, err := app.ParseConfig("CONVEYOR_")
	if err != nil {
		return err
	}

	_, err = logging.NewGlobalLogger(config.Log.Level, config.Log.Format)
	if err != nil {
		return err
	}

	tracing, err := tracing.NewGlobal(startCtx, config.Tracing)
	if err != nil {
		return err
	}

	errs := make(chan error)

	app := app.New(config)

	go func() {
		errs <- app.Start(startCtx)
	}()

	select {
	case <-startCtx.Done():
	case err = <-errs:
		if err != nil {
			return err
		}
	}

	stopCtx, stopCtxCancel := context.WithTimeout(ctx, time.Minute)
	defer stopCtxCancel()

	return errors.Join(err, app.Stop(stopCtx), tracing.Stop(stopCtx))
}
