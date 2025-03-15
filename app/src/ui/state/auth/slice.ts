import { PasswordChangeRequiredError, type PlaintextPassword } from "@/auth"
import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

export type AuthStatus =
    | "not-authenticated"
    | "authenticating"
    | "authenticated"
    | "error"
    | "password-change-required"
    | "password-change-in-progress"
    | "password-change-error"

export interface AuthState {
    error?: Error
    status: AuthStatus
}

const initialState: AuthState = {
    status: "not-authenticated",
}

export const slice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        authenticate: (
            state,
            _: PayloadAction<{
                username: string
                password: PlaintextPassword
                server: string
            }>,
        ) => {
            state.error = undefined
        },
        setAuthStatus: (
            state,
            { payload }: PayloadAction<{ status: AuthStatus; error?: Error }>,
        ) => {
            state.status = payload.status
            state.error = payload.error

            if (payload.error instanceof PasswordChangeRequiredError) {
                state.status = "password-change-required"
            }
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
        status: (state) => state.status,
        error: (state) => state.error,
    },
})
