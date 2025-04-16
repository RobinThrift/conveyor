import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

import type { Params, Restore, Screens } from "@/control/NavigationController"
import type { NavgationState } from "@/lib/navigation"

const initialState: NavgationState<Screens, keyof Screens, Restore> = {
    screen: {
        name: "root",
        params: {},
    },
    restore: {
        scrollOffsetTop: 0,
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
            }>,
        ) => {
            state.screen = {
                name: payload.name,
                params: payload.params,
            }
            state.restore = payload.restore
        },
    },

    selectors: {
        currentName: (state) => state.screen.name,
        currentParams: (state) => state.screen.params,
        currentRestore: (state) => state.restore,
    },
})
