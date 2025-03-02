import { type PayloadAction, createSlice } from "@reduxjs/toolkit"
// import type { StartListening } from "@/ui/state/rootStore"

export interface StorageState {
    filename: string
    isReady: boolean
    error?: Error

    enableTracing: boolean
}

const initialState: StorageState = {
    filename: "belt.db",
    isReady: false,
    enableTracing: true,
}

export const slice = createSlice({
    name: "storage",
    reducerPath: "global.storage",
    initialState,
    reducers: {
        init: (
            state,
            _: PayloadAction<{
                password: string
            }>,
        ) => {
            state.isReady = false
            state.error = undefined
        },
        isReady: (state) => {
            state.isReady = true
            state.error = undefined
        },
        setError: (
            state,
            {
                payload,
            }: PayloadAction<{
                error: Error
            }>,
        ) => {
            state.isReady = false
            state.error = payload.error
        },
    },

    selectors: {
        isReady: (state) => state.isReady,
        error: (state) => state.error,
    },
})

// export const registerEffects = (startListening: StartListening) => {
//     startListening({
//         actionCreator: slice.actions.init,
//         effect: async (
//             { payload: { password } },
//             { getState, cancelActiveListeners, dispatch },
//         ) => {
//             cancelActiveListeners()
//
//             let state = getState()["global.storage"]
//
//             try {
//                 await initLocalStorage({
//                     file: state.filename,
//                     enckey: password,
//                     enableTracing: state.enableTracing,
//                 })
//             } catch (err) {
//                 dispatch(
//                     slice.actions.setError({
//                         error: err as Error,
//                     }),
//                 )
//                 return
//             }
//
//             dispatch(slice.actions.isReady())
//         },
//     })
// }
