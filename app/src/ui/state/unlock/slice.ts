import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

import type { PlaintextPrivateKey } from "@/lib/crypto"

export interface UnlockState {
    state: "locked" | "unlocking" | "unlocked"
    error?: Error
}

const initialState: UnlockState = {
    state: "locked",
}

export const slice = createSlice({
    name: "unlock",
    initialState,
    reducers: {
        unlock: (
            state,
            _: PayloadAction<{
                plaintextKeyData: PlaintextPrivateKey
                storeKey?: boolean
                db?: {
                    file?: string
                    enableTracing?: boolean
                }
            }>,
        ) => {
            state.error = undefined
            state.state = "unlocking"
        },
        setUnlockState: (
            state,
            { payload }: PayloadAction<{ state: UnlockState["state"]; error?: Error }>,
        ) => {
            state.state = payload.state
            state.error = payload.error
        },
    },

    selectors: {
        isUnlocked: (state) => state.state === "unlocked",
        state: (state) => state.state,
        error: (state) => state.error,
    },
})
