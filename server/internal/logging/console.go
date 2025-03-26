package logging

import (
	"bytes"
	"context"
	"io"
	"os"
	"runtime"
	"strconv"
	"strings"
	"time"

	"log/slog"
)

//nolint:gochecknoglobals
var cwd, _ = os.Getwd()

type consoleHandler struct {
	level slog.Level
	out   io.Writer

	noColor bool

	group string
	attrs []slog.Attr
}

func (h *consoleHandler) Enabled(_ context.Context, l slog.Level) bool {
	return l >= h.level
}

func (h *consoleHandler) Handle(_ context.Context, record slog.Record) error { //nolint:cyclop
	var msg bytes.Buffer

	if h.level <= slog.LevelDebug {
		msg.WriteString(record.Time.Format(time.TimeOnly))
		msg.WriteString(" ")
	}

	if !h.noColor {
		color := ""

		switch record.Level {
		case slog.LevelDebug:
			color = "\x1b[34m" // blue
		case slog.LevelInfo:
			color = "\x1b[32m" // green
		case slog.LevelWarn:
			color = "\x1b[33m" // yellow
		case slog.LevelError:
			color = "\x1b[31m" // red
		}

		msg.WriteString(color)
		msg.WriteString(record.Level.String())
		msg.WriteString("\x1b[0m ") // reset
	}

	if h.level <= slog.LevelDebug && record.PC != 0 {
		f := runtime.FuncForPC(record.PC)
		file, line := f.FileLine(record.PC)

		file = strings.Replace(file, cwd+"/", "", 1)

		if !h.noColor {
			msg.WriteString("\x1b[90m") // reset
		}

		msg.WriteString(file)
		msg.WriteString(":")
		msg.WriteString(strconv.Itoa(line))
		msg.WriteString(" ")

		if !h.noColor {
			msg.WriteString("\x1b[0m") // reset
		}
	}

	msg.WriteString(record.Message)

	for _, a := range h.attrs {
		h.writeAttr(&msg, a)
	}

	record.Attrs(func(a slog.Attr) bool {
		h.writeAttr(&msg, a)

		return true
	})

	msg.WriteString("\n")

	_, err := h.out.Write(msg.Bytes())

	return err
}

func (h *consoleHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	nextAttrs := h.attrs

	if h.group != "" {
		args := make([]any, 0, len(attrs))
		for _, attr := range attrs {
			args = append(args, attr)
		}

		nextAttrs = append(nextAttrs, slog.Group(h.group, args...))
	} else {
		nextAttrs = append(nextAttrs, attrs...)
	}

	return &consoleHandler{
		level: h.level,
		out:   h.out,
		attrs: nextAttrs,
	}
}

func (h *consoleHandler) WithGroup(name string) slog.Handler {
	return &consoleHandler{
		level: h.level,
		out:   h.out,
		group: name,
		attrs: h.attrs,
	}
}

func (h *consoleHandler) writeAttr(msg *bytes.Buffer, a slog.Attr) {
	msg.WriteRune(' ')

	if a.Key == "error" && !h.noColor {
		msg.WriteString("\x1b[31m")
		msg.WriteString(a.Key)
		msg.WriteString("\x1b[0m")
	} else {
		msg.WriteString(a.Key)
	}

	msg.WriteString(`="`)
	msg.WriteString(a.Value.String())
	msg.WriteRune('"')
}

func determineNoColor() bool {
	if asBool, err := strconv.ParseBool(os.Getenv("NO_COLOR")); err == nil {
		return asBool
	}

	return false
}
