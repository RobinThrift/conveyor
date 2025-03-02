import type { Settings } from "@/domain/Settings"
import { type KeyPaths, type ValueAt, getPath, setPath } from "@/lib/getset"
import type { RootState, StartListening } from "@/ui/state/rootStore"
// import * as settingsStore from "@/storage/settings"
import {
    type PayloadAction,
    createSelector,
    createSlice,
} from "@reduxjs/toolkit"
import { useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"

export interface SettingsState {
    error?: Error
    values: Settings
}

const initialState: SettingsState = {
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
            error: undefined,
            values: payload,
        }),
        updated: (state, { payload }: PayloadAction<Error | undefined>) => ({
            ...state,
            error: payload,
        }),
        set: <K extends KeyPaths<Settings>>(
            state: SettingsState,
            { payload }: PayloadAction<{ key: K; value: ValueAt<Settings, K> }>,
        ) => ({
            ...state,
            values: setPath(state.values, payload.key, payload.value),
        }),
    },

    selectors: {
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

export const registerEffects = (_startListening: StartListening) => {
    // startListening({
    //     actionCreator: slice.actions.set,
    //     effect: async (
    //         { payload },
    //         { cancelActiveListeners, dispatch, signal },
    //     ) => {
    //         cancelActiveListeners()
    //
    //         let err: Error | undefined
    //         try {
    //             await settingsStore.update({
    //                 setting: {
    //                     key: payload.key,
    //                     value: payload.value,
    //                 },
    //                 signal,
    //             })
    //         } catch (e) {
    //             err = e as Error
    //         }
    //
    //         dispatch(slice.actions.updated(err))
    //     },
    // })
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
    [slice.selectors.mode, slice.selectors.colourScheme],
    (mode, colourScheme) => ({
        mode,
        colourScheme,
    }),
)

export function useTheme() {
    return useSelector(themeSelector)
}
