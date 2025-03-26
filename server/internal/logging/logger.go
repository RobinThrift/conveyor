package logging

import (
	"fmt"
	"log/slog"
	"os"
	"strings"
)

func NewLogger(loglevel string, format string) (*slog.Logger, error) {
	handler, _, err := NewHandler(loglevel, format)
	if err != nil {
		return nil, err
	}

	return slog.New(handler), nil
}

func NewGlobalLogger(level string, format string) (*slog.Logger, error) {
	logger, err := NewLogger(level, format)
	if err != nil {
		return nil, err
	}

	slog.SetDefault(logger)

	return logger, nil
}

func NewHandler(loglevel string, format string) (slog.Handler, slog.Level, error) {
	loglevel = strings.ToLower(loglevel)

	var level slog.Level

	switch loglevel {
	case "debug":
		level = slog.LevelDebug
	case "warn":
		level = slog.LevelWarn
	case "error":
		level = slog.LevelError
	case "info":
		level = slog.LevelInfo
	default:
		return nil, 0, fmt.Errorf("unknown log level '%s'", loglevel) //nolint:err113
	}

	var handler slog.Handler

	switch format {
	case "console":
		noColor := determineNoColor()
		handler = &ctxHandler{handler: &consoleHandler{level: level, out: os.Stdout, noColor: noColor}, emitLogInTrace: true}
	case "json":
		handler = &ctxHandler{handler: slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level}), emitLogInTrace: true}
	default:
		return nil, 0, fmt.Errorf("unknown log format '%s'", format) //nolint:err113
	}

	return handler, level, nil
}
