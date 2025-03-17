import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

import type { PlaintextPrivateKey } from "@/lib/crypto"

export interface UnlockState {
    isUnlocked?: boolean
    error?: Error
}

const initialState: UnlockState = {
    isUnlocked: false,
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
        },
        setIsUnlocked: (
            state,
            { payload }: PayloadAction<{ isUnlocked: boolean; error?: Error }>,
        ) => {
            state.isUnlocked = payload.isUnlocked
            state.error = payload.error
        },
    },

    selectors: {
        isUnlocked: (state) => state.isUnlocked,
        error: (state) => state.error,
    },
})
