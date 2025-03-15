import { type KeyPaths, type ValueAt, setPath } from "@/lib/getset"
import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

import type { PrivateCryptoKey } from "@/lib/crypto"

export type SetupStep =
    | "unknown"
    | "initial-setup"
    | "choose-sync-method"
    | "configure-remote-sync"
    | "testing-remote-sync"
    | "configure-encryption"
    | "start-sync"
    | "sync"
    | "done"
    | "remote-error"
    | "sync-error"
    | "unknown-error"
    | "load-error"

export type SyncMethod = "local-only" | "remote-sync"

export interface SetupState {
    isSetup: boolean

    error?: Error
    step: SetupStep

    selectedOptions: {
        isNew: boolean
        syncMethod: SyncMethod
        candidatePrivateCryptoKey?: PrivateCryptoKey
    }
}

const initialState: SetupState = {
    isSetup: false,

    step: "unknown",

    selectedOptions: {
        isNew: false,
        syncMethod: "local-only",
    },
}

export const slice = createSlice({
    name: "setup",
    initialState,
    reducers: {
        loadSetupInfo: (state) => state,

        startNew: (state) => {
            state.selectedOptions.isNew = true
            state.step = "choose-sync-method"
        },

        startFromRemote: (state) => {
            state.selectedOptions.isNew = false
            state.step = "configure-remote-sync"
        },

        next: (state) => {
            switch (state.step) {
                case "configure-remote-sync":
                    state.step = "configure-encryption"
                    break
                case "choose-sync-method":
                    if (state.selectedOptions.syncMethod === "remote-sync") {
                        state.step = "configure-remote-sync"
                    } else {
                        state.step = "configure-encryption"
                    }
                    break
                case "configure-encryption":
                    if (state.selectedOptions.isNew) {
                        state.step = "done"
                    } else {
                        state.step = "start-sync"
                    }
                    break
                case "start-sync":
                    state.step = "done"
                    break
                case "remote-error":
                    state.step = "configure-remote-sync"
                    break
                case "sync-error":
                    state.step = "configure-encryption"
                    break
            }
        },

        setSetupOption: <K extends KeyPaths<SetupState["selectedOptions"]>>(
            state: SetupState,
            {
                payload,
            }: PayloadAction<{
                key: K
                value: ValueAt<SetupState["selectedOptions"], K>
            }>,
        ) => {
            state.selectedOptions = setPath(
                state.selectedOptions,
                payload.key,
                payload.value,
            )
        },

        setupCandidatePrivateCryptoKey: (
            state,
            { payload }: PayloadAction<{ key: PrivateCryptoKey }>,
        ) => {
            state.selectedOptions.candidatePrivateCryptoKey = payload.key

            if (state.selectedOptions.isNew) {
                state.step = "done"
            } else {
                state.step = "start-sync"
            }
        },

        setIsSetup: (
            state,
            { payload }: PayloadAction<{ isSetup: boolean }>,
        ) => {
            state.isSetup = payload.isSetup
            state.step = "done"
        },
        setStep: (
            state,
            { payload }: PayloadAction<{ step: SetupStep; error?: Error }>,
        ) => {
            state.step = payload.step
            state.error = payload.error
        },
    },

    selectors: {
        step: (state) => state.step,
        isSetup: (state) => state.isSetup,
        selectedOptions: (state) => state.selectedOptions,
        error: (state) => state.error,
    },
})
