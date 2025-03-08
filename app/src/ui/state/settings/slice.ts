import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

import { DEFAULT_SETTINGS, type Settings } from "@/domain/Settings"
import { type KeyPaths, type ValueAt, getPath, setPath } from "@/lib/getset"

export interface SettingsState {
    error?: Error
    isLoading: boolean
    isLoaded: boolean
    values: Settings
}

const initialState: SettingsState = {
    values: DEFAULT_SETTINGS,
    isLoading: false,
    isLoaded: false,
}

export const slice = createSlice({
    name: "settings",
    initialState,
    reducers: {
        set: <K extends KeyPaths<Settings>>(
            state: SettingsState,
            { payload }: PayloadAction<{ key: K; value: ValueAt<Settings, K> }>,
        ) => ({
            ...state,
            values: setPath(state.values, payload.key, payload.value),
        }),
        loadStart: (state) => {
            state.isLoading = true
        },
        loadDone: (_, { payload }: PayloadAction<Settings>) => ({
            error: undefined,
            isLoading: false,
            isLoaded: true,
            values: payload,
        }),
        setError: (state, { payload }: PayloadAction<Error | undefined>) => ({
            ...state,
            error: payload,
        }),
    },

    selectors: {
        value: <K extends KeyPaths<Settings>>(
            state: SettingsState,
            key: K,
        ): ValueAt<Settings, K> => getPath(state.values, key),
        isLoading: (state) => state.isLoading,
        isLoaded: (state) => state.isLoaded,
        mode: (state) => {
            if (state.values.theme.mode === "auto") {
                return window.matchMedia("(prefers-color-scheme: dark)").matches
                    ? "dark"
                    : "light"
            }
            return state.values.theme.mode
        },
        colourScheme: (state) => {
            return state.values.theme.colourScheme
        },
    },
})
