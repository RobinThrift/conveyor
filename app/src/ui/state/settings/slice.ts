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
        loadStart: (state) => state,
        setIsLoading: (state) => {
            state.isLoading = true
            state.error = undefined
        },
        loadDone: (_, { payload }: PayloadAction<Settings>) => ({
            error: undefined,
            isLoading: false,
            isLoaded: true,
            values: payload,
        }),
        setError: (state, { payload }: PayloadAction<Error | undefined>) => ({
            ...state,
            isLoading: false,
            error: payload,
        }),

        setExternal: <K extends KeyPaths<Settings>>(
            state: SettingsState,
            { payload }: PayloadAction<{ key: K; value: ValueAt<Settings, K> }>,
        ) => ({
            ...state,
            values: setPath(state.values, payload.key, payload.value),
        }),
    },

    selectors: {
        value: <K extends KeyPaths<Settings>>(
            state: SettingsState,
            key: K,
        ): ValueAt<Settings, K> => getPath(state.values, key),
        isLoading: (state) => state.isLoading,
        isLoaded: (state) => state.isLoaded,
        error: (state) => state.error,
        mode: (state) => {
            return state.values.ui.colourScheme.mode
        },
        colourScheme: (state) => {
            return state.values.ui.colourScheme
        },
    },
})
