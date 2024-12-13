import type { Memo } from "@/domain/Memo"
import * as memoStorage from "@/storage/memos"
import { type PayloadAction, createSlice } from "@reduxjs/toolkit"
import { slice as notifications } from "./notifications"
import type { StartListening } from "./rootStore"

export type UpdateMemoRequest = memoStorage.UpdateMemoRequest

export interface MemosState {
    memos: Record<
        string,
        {
            error?: Error
            isLoading: boolean
            memo: Memo
        }
    >
}

const initialState: MemosState = {
    memos: {},
}

export const slice = createSlice({
    name: "Memos",
    initialState,
    reducers: {
        load: (state, _: PayloadAction<{ id: string }>) => state,
        update: (state, _: PayloadAction<{ memo: UpdateMemoRequest }>) => state,
        setMemo: (state, { payload: memo }: PayloadAction<Memo>) => ({
            ...state,
            memos: {
                ...state.memos,
                [memo.id]: {
                    memo: memo,
                    isLoading: false,
                },
            },
        }),
        setError: (
            state,
            { payload }: PayloadAction<{ memoID: string; error: Error }>,
        ) => {
            let memoState = state.memos[payload.memoID]
            if (!memoState) {
                return state
            }

            return {
                ...state,
                memos: {
                    ...state.memos,
                    [memoState.memo.id]: {
                        ...memoState,
                        isLoading: false,
                        error: payload.error,
                    },
                },
            }
        },
    },
})

export const registerEffects = (startListening: StartListening) => {
    startListening({
        actionCreator: slice.actions.load,
        effect: async (
            { payload: { id } },
            { cancelActiveListeners, dispatch, signal },
        ) => {
            cancelActiveListeners()

            let memo: Memo
            try {
                memo = await memoStorage.get({
                    id,
                    signal,
                })
            } catch (err) {
                dispatch(
                    slice.actions.setError({
                        memoID: id,
                        error: err as Error,
                    }),
                )
                return
            }

            dispatch(slice.actions.setMemo(memo))
            dispatch(
                notifications.actions.add({
                    notification: {
                        type: "info",
                        title: "New Memo created",
                        durationMs: 1000,
                    },
                }),
            )
        },
    })

    startListening({
        actionCreator: slice.actions.update,
        effect: async (
            { payload: { memo } },
            { cancelActiveListeners, dispatch, signal },
        ) => {
            cancelActiveListeners()

            let updated: Memo
            try {
                await memoStorage.update({
                    memo,
                    signal,
                })

                updated = await memoStorage.get({
                    id: memo.id,
                    signal,
                })
            } catch (err) {
                dispatch(
                    slice.actions.setError({
                        memoID: memo.id,
                        error: err as Error,
                    }),
                )
                return
            }

            dispatch(slice.actions.setMemo(updated))
            dispatch(
                notifications.actions.add({
                    notification: {
                        type: "info",
                        title: "Memo Updated",
                        durationMs: 1000,
                    },
                }),
            )
        },
    })

    startListening({
        actionCreator: slice.actions.setError,
        effect: async ({ payload: { error } }, { dispatch }) => {
            let [title, message] = error.message.split(/:\n/, 2)
            dispatch(
                notifications.actions.add({
                    notification: {
                        type: "error",
                        title,
                        message,
                    },
                }),
            )
        },
    })
}
