import type { PlaintextPassword } from "@/auth"
import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

export interface AuthState {
    error?: Error
    isLoading: boolean
}

const initialState: AuthState = {
    isLoading: false,
}

export const slice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        getInitialToken: (
            state,
            _: PayloadAction<{ username: string; password: PlaintextPassword }>,
        ) => {
            state.error = undefined
        },
        setAuthStatus: (
            state,
            { payload }: PayloadAction<{ isLoading: boolean; error?: Error }>,
        ) => {
            state.isLoading = payload.isLoading
            state.error = payload.error
        },
        changePassword: (
            state,
            _: PayloadAction<{
                username: string
                currentPassword: PlaintextPassword
                newPassword: PlaintextPassword
                newPasswordRepeat: PlaintextPassword
            }>,
        ) => {
            state.error = undefined
        },
    },

    selectors: {
        isLoading: (state) => state.isLoading,
        error: (state) => state.error,
    },
})
