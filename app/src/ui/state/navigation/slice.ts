import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

import type { Params, Restore, Screens } from "@/control/NavigationController"
import type { NavgationState } from "@/lib/navigation"

interface NavigationSlice {
    current: NavgationState<Screens, keyof Screens, Restore>
    prev?: NavgationState<Screens, keyof Screens, Restore>
}

const initialState: NavigationSlice = {
    current: {
        screen: {
            name: "root",
            params: {},
        },
        stack: 0,
        index: 0,
        restore: {
            scrollOffsetTop: 0,
        },
    },
}

export const slice = createSlice({
    name: "navigation",
    initialState,
    reducers: {
        setPage: (
            state,
            {
                payload,
            }: PayloadAction<{
                name: keyof Screens
                params: Params
                restore: Partial<Restore>
                stack?: number
                index?: number
            }>,
        ) => {
            state.prev = { ...state.current }
            state.current.screen = {
                name: payload.name,
                params: payload.params,
            }
            state.current.index = payload.index ?? state.current.index
            state.current.stack = payload.stack ?? state.current.stack
            state.current.restore = payload.restore
        },
    },

    selectors: {
        currentName: (state) => state.current.screen.name,
        currentParams: (state) => state.current.screen.params,
        currentRestore: (state) => state.current.restore,
        prevName: (state) => state.prev?.screen.name,
        prevParams: (state) => state.prev?.screen.params,
        prevRestore: (state) => state.prev?.restore,
    },
})
