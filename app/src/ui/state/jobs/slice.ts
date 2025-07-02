import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

type Jobs = "cleanup" | "export"

type JobStatus = {
    status: "requested" | "running" | "done" | "error"
    error?: Error
}

type JobsState = Record<Jobs, JobStatus | undefined>

const initialState: JobsState = {
    cleanup: undefined,
    export: undefined,
}

export const slice = createSlice({
    name: "jobs",
    initialState,
    reducers: {
        startJob: (state, { payload }: PayloadAction<{ job: Jobs; params?: any }>) => {
            state[payload.job] = {
                status: "requested",
                error: undefined,
            }
        },

        setJobStatus: (state, { payload }: PayloadAction<{ job: Jobs } & JobStatus>) => {
            state[payload.job] = {
                status: payload.status,
                error: payload.error,
            }
        },

        resetJob: (state, { payload }: PayloadAction<{ job: Jobs }>) => {
            state[payload.job] = undefined
        },
    },

    selectors: {
        getJob: (state, job: Jobs) => state[job],
    },
})
