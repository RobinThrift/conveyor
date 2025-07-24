import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import { Code } from "./Code"

import "@/ui/styles/index.css"

const meta: Meta<typeof Code> = {
    title: "Components/Markdown/Code",
    component: Code,
    parameters: {
        layout: "fullscreen",
    },
    render: (args) => (
        <div className="container mx-auto flex min-h-screen py-3 items-center">
            <Code {...args} className="p-3 rounded-lg shadow-md w-full" />
        </div>
    ),
}

export default meta
type Story = StoryObj<typeof Code>

export const Go: Story = {
    args: {
        lang: "go",
        children: `type App struct {
	config Config
	srv    *http.Server
	db     *sqlite.SQLite
}

func main() {
	if err := run(context.Background()); err != nil {
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
}`,
    },
}

export const TypeScript: Story = {
    name: "TypeScript",
    args: {
        lang: "typescript",
        children: `function parseMarkdown(raw: string): React.ReactNode | React.ReactNode[] {
    let ast = fromMarkdown(raw)
    return ast.children.map((c) => astNodeToJSX(c))
}`,
    },
}
