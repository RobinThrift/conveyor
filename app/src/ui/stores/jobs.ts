import type { BackendClient } from "@/backend/BackendClient"
import { createActions, createEffect, createStore } from "@/lib/store"

type Jobs = "cleanup" | "export"

type JobStatus = "requested" | "running" | "done" | "error"

export const currentJob = createStore<
    { name: Jobs; status: JobStatus; params?: any; error?: Error } | undefined
>("jobs/currentJob", undefined)

export const actions = createActions({
    startJob: (job: Jobs, params?: any) => {
        if (!selectors.isReady(currentJob.state)) {
            return
        }

        currentJob.setState({
            name: job,
            params,
            status: "requested",
        })
    },
})

export const selectors = {
    isReady: (state: typeof currentJob.state) =>
        typeof state === "undefined" || state.status === "done" || state.status === "error",
    isBusy: (state: typeof currentJob.state) =>
        typeof state !== "undefined" &&
        (state.status === "requested" || state.status === "running"),
}

export function registerEffects(backend: BackendClient) {
    createEffect("jobs/startJob", {
        fn: async (ctx) => {
            if (!currentJob.state || currentJob.state.status !== "requested") {
                return
            }

            let [, err] = await backend.jobs.startJob(
                ctx,
                currentJob.state.name,
                currentJob.state.params,
            )
            if (err) {
                currentJob.setState({
                    name: currentJob.state.name,
                    status: "error",
                    error: err as Error,
                })
                return
            }
        },
        autoMount: true,
        deps: [currentJob],
        precondition: () => currentJob.state?.status === "requested",
        eager: false,
    })

    backend.addEventListener("job/start", ({ name }) => {
        if (currentJob.state?.name === name) {
            currentJob.setState({
                name: name as Jobs,
                status: "running",
            })
        }
    })

    backend.addEventListener("job/end", ({ name }) => {
        if (currentJob.state?.name === name) {
            currentJob.setState({
                name: name as Jobs,
                status: "done",
            })
        }
    })

    backend.addEventListener("job/error", ({ name, error }) => {
        if (currentJob.state?.name === name) {
            currentJob.setState({
                name: name as Jobs,
                status: "error",
                error: error,
            })
        }
    })
}
