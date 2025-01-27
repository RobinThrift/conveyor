import type { Settings } from "@/domain/Settings"
import { type KeyPaths, type ValueAt, getPath, setPath } from "@/helper"
import type { RootState, StartListening } from "@/state/rootStore"
import * as settingsStore from "@/storage/remote/settings"
import { type Theme, themes } from "@/themes"
import {
    type PayloadAction,
    createSelector,
    createSlice,
} from "@reduxjs/toolkit"
import { useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"

export interface SettingsState {
    isLoading: boolean
    error?: Error
    values: Settings
}

const initialState: SettingsState = {
    isLoading: false,

    values: {
        locale: {
            language: "en",
            region: "gb",
        },

        theme: {
            colourScheme: "default",
            mode: "auto",
            icon: "default",
            listLayout: "masonry",
        },
        controls: {
            vim: false,
            doubleClickToEdit: true,
        },
    },
}

export const slice = createSlice({
    name: "settings",
    reducerPath: "global.settings",
    initialState,
    reducers: {
        init: (_, { payload }: PayloadAction<Settings>) => ({
            isLoading: false,
            error: undefined,
            values: payload,
        }),
        updated: (state, { payload }: PayloadAction<Error | undefined>) => ({
            ...state,
            isLoading: false,
            error: payload,
        }),
        set: <K extends KeyPaths<Settings>>(
            state: SettingsState,
            { payload }: PayloadAction<{ key: K; value: ValueAt<Settings, K> }>,
        ) => ({
            ...state,
            isLoading: true,
            values: setPath(state.values, payload.key, payload.value),
        }),
    },

    selectors: {
        isLoading: (state) => {
            return state.isLoading
        },
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
        colous: (state) => {
            let resolvedMode: keyof Theme

            if (state.values.theme.mode === "auto") {
                resolvedMode = window.matchMedia("(prefers-color-scheme: dark)")
                    .matches
                    ? "dark"
                    : "light"
            } else {
                resolvedMode = state.values.theme.mode
            }

            return themes[state.values.theme.colourScheme][resolvedMode]
        },
    },
})

export const registerEffects = (startListening: StartListening) => {
    startListening({
        actionCreator: slice.actions.set,
        effect: async (
            { payload },
            { cancelActiveListeners, dispatch, signal },
        ) => {
            cancelActiveListeners()

            let err: Error | undefined
            try {
                await settingsStore.update({
                    settings: {
                        [payload.key]: payload.value,
                    },
                    signal,
                })
            } catch (e) {
                err = e as Error
            }

            dispatch(slice.actions.updated(err))
        },
    })
}

export function useSetting<K extends KeyPaths<Settings>>(
    keypath: K,
): [ValueAt<Settings, K>, (v: ValueAt<Settings, K>) => void] {
    let value = useSelector((state: RootState) =>
        getPath(state["global.settings"].values, keypath),
    )
    let dispatch = useDispatch()
    return useMemo(
        () => [
            value,
            (v) =>
                dispatch(slice.actions.set({ key: keypath, value: v as any })),
        ],
        [keypath, value, dispatch],
    )
}

const themeSelector = createSelector(
    [
        slice.selectors.mode,
        slice.selectors.colourScheme,
        slice.selectors.colous,
    ],
    (mode, colourScheme, colours) => ({
        mode,
        colourScheme,
        colours,
    }),
)

export function useTheme() {
    return useSelector(themeSelector)
}

export function useSettingsIsLoading() {
    return useSelector(slice.selectors.isLoading)
}
