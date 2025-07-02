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
    isSyncRequested: boolean
}

const initialState: SyncState = {
    status: "disabled",
    info: { isEnabled: false },
    isSyncRequested: false,
}

export const slice = createSlice({
    name: "sync",
    initialState,
    reducers: {
        loadSyncInfo: (state, _: PayloadAction<{ syncOnLoad?: boolean } | undefined>) => state,
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
            {
                payload,
            }: PayloadAction<{
                status: SyncStatus
                error?: Error
                isSyncRequested?: boolean
            }>,
        ) => {
            state.status = payload.status
            state.error = payload.error
            state.isSyncRequested = payload.isSyncRequested ?? state.isSyncRequested
        },

        disable: (state) => {
            state.status = "disabled"
            state.info = { isEnabled: false }
        },

        syncStart: (state) => {
            state.error = undefined
            state.isSyncRequested = true
        },

        syncStartUploadFull: (state) => {
            state.error = undefined
        },

        syncStartDownloadFull: (state) => {
            state.error = undefined
        },

        reset: (state) => {
            state.status = "disabled"
            state.info = { isEnabled: false }
            state.error = undefined
            state.isSyncRequested = false
        },
    },

    selectors: {
        status: (state: SyncState) => state.status,
        info: (state: SyncState) => state.info,
        error: (state) => state.error,
        setupInfo: (state: SyncState) => state.setup,
        isEnabled: (state: SyncState) => state.info.isEnabled,
        isSyncRequested: (state: SyncState) => state.isSyncRequested,
    },
})
