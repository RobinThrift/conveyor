import { type KeyPaths, type ValueAt, setPath } from "@/lib/getset"
import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

import type { PlaintextPrivateKey } from "@/lib/crypto"

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
        candidatePrivateCryptoKey?: PlaintextPrivateKey
    }
}

const initialState: SetupState = {
    isSetup: false,

    step: "initial-setup",

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
            state.step = "configure-encryption"
        },

        startFromRemote: (state) => {
            state.selectedOptions.isNew = false
            state.step = "configure-encryption"
        },

        next: (state) => {
            switch (state.step) {
                case "configure-encryption":
                    if (state.selectedOptions.isNew) {
                        state.step = "choose-sync-method"
                    } else {
                        state.step = "configure-remote-sync"
                    }
                    break
                case "choose-sync-method":
                    if (state.selectedOptions.syncMethod === "remote-sync") {
                        state.step = "configure-remote-sync"
                    } else {
                        state.step = "done"
                    }
                    break
                case "configure-remote-sync":
                    if (state.selectedOptions.isNew) {
                        state.step = "done"
                    } else {
                        state.step = "start-sync"
                    }
                    break
                case "start-sync":
                    state.step = "sync"
                    break
                case "sync":
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
            {
                payload,
            }: PayloadAction<{ plaintextKeyData: PlaintextPrivateKey }>,
        ) => {
            state.selectedOptions.candidatePrivateCryptoKey =
                payload.plaintextKeyData

            if (state.selectedOptions.isNew) {
                state.step = "choose-sync-method"
            } else {
                state.step = "configure-remote-sync"
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
        isNew: (state) => state.selectedOptions.isNew,
        error: (state) => state.error,
    },
})
