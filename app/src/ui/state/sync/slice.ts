import type { PlaintextPassword } from "@/auth"
import type { SyncInfo } from "@/domain/SyncInfo"
import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

export type SyncStatus =
    | "disabled"
    | "awaiting-authentication"
    | "setting-up"
    | "ready"
    | "syncing"
    | "error"

export interface SyncState {
    error?: Error
    status: SyncStatus
    setup?: { server: string; username: string }
    info: SyncInfo
}

const initialState: SyncState = {
    status: "disabled",
    info: { isEnabled: false },
}

export const slice = createSlice({
    name: "sync",
    initialState,
    reducers: {
        loadSyncInfo: (state) => state,
        setup: (
            state,
            {
                payload,
            }: PayloadAction<{
                server: string
                username: string
                password: PlaintextPassword
            }>,
        ) => {
            state.setup = { server: payload.server, username: payload.username }
            state.error = undefined
        },
        setSyncInfo: (state, { payload }: PayloadAction<SyncInfo>) => {
            state.info = payload
        },
        setStatus: (
            state,
            { payload }: PayloadAction<{ status: SyncStatus; error?: Error }>,
        ) => {
            state.status = payload.status
            state.error = payload.error
        },
        disable: (state) => {
            state.status = "disabled"
            state.info = { isEnabled: false }
        },
        syncStart: (state) => {
            state.error = undefined
        },
        syncStartUploadFull: (state) => {
            state.error = undefined
        },
        syncStartDownloadFull: (state) => {
            state.error = undefined
        },
    },

    selectors: {
        status: (state: SyncState) => state.status,
        info: (state: SyncState) => state.info,
        error: (state) => state.error,
        setupInfo: (state: SyncState) => state.setup,
    },
})
