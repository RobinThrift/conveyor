import type { PlaintextPassword } from "@/auth"
import type { SyncInfo } from "@/domain/SyncInfo"
import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

type SyncStatus = "disabled" | "setting-up" | "ready" | "syncing" | "error"

export interface SyncState {
    error?: Error
    status: SyncStatus
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
            _: PayloadAction<{
                serverAddr: string
                username: string
                password: PlaintextPassword
            }>,
        ) => {
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
    },
})
