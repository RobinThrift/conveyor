import { combineSlices } from "@reduxjs/toolkit"

import { BaseContext } from "@/lib/context"
import type { MemoStorage } from "@/storage/memos"
import type { RootState, StartListening } from "@/ui/state/rootStore"

import * as create from "./create"
import * as list from "./list"
import * as single from "./single"
import * as update from "./update"

export type { Filter } from "./list"
export type { CreateMemoRequest } from "./create"
export type { UpdateMemoRequest } from "./update"

export const slice = {
    reducerPath: "memos",
    reducer: combineSlices(
        list.slice,
        create.slice,
        update.slice,
        single.slice,
    ),
}

export const selectors = {
    ...list.slice.getSelectors((state: RootState) => state.memos.list),
    ...create.slice.getSelectors((state: RootState) => state.memos.create),
    ...update.slice.getSelectors((state: RootState) => state.memos.update),
    ...single.slice.getSelectors((state: RootState) => state.memos.single),
}

export const actions = {
    ...list.slice.actions,
    ...create.slice.actions,
    ...update.slice.actions,
    ...single.slice.actions,
}

export const registerEffects = (startListening: StartListening) => {
    list.registerEffects(startListening)
}

export const registerStorageEffects = ({
    startListening,
    memoStorage,
}: {
    memoStorage: MemoStorage
    startListening: StartListening
}) => {
    startListening({
        actionCreator: list.slice.actions.loadPage,
        effect: async (
            { payload: { filter, pagination } },
            { cancelActiveListeners, dispatch, signal },
        ) => {
            cancelActiveListeners()

            let memos = await memoStorage.listMemos(
                BaseContext.withData("db", undefined).withSignal(signal),
                {
                    filter,
                    pagination,
                },
            )

            if (!memos.ok) {
                dispatch(
                    list.slice.actions.setError({
                        error: memos.err,
                    }),
                )
                return
            }

            if (signal.aborted) {
                return
            }

            dispatch(list.slice.actions.appendMemos(memos.value))
        },
    })

    startListening({
        actionCreator: create.slice.actions.create,
        effect: async (
            { payload },
            { cancelActiveListeners, getState, dispatch, signal },
        ) => {
            cancelActiveListeners()

            let created = await memoStorage.createMemo(
                BaseContext.withData("db", undefined).withSignal(signal),
                payload.memo,
            )

            if (!created.ok) {
                dispatch(
                    create.slice.actions.setError({
                        error: created.err,
                    }),
                )
                return
            }

            let state = getState()

            dispatch(create.slice.actions.setDone({ memo: created.value }))
            if (Object.keys(selectors.filter(state)).length === 0) {
                dispatch(
                    list.slice.actions.prependMemo({ memo: created.value }),
                )
            }
        },
    })

    startListening({
        actionCreator: single.slice.actions.setCurrentSingleMemoID,
        effect: async (
            { payload },
            { cancelActiveListeners, dispatch, signal },
        ) => {
            cancelActiveListeners()

            let ctx = BaseContext.withData("db", undefined).withSignal(signal)

            let memo = await memoStorage.getMemo(ctx, payload.id)
            if (!memo.ok) {
                dispatch(
                    update.slice.actions.setError({
                        error: memo.err,
                    }),
                )
                return
            }

            dispatch(
                single.slice.actions.setCurrentSingleMemo({ memo: memo.value }),
            )
        },
    })

    startListening({
        actionCreator: update.slice.actions.update,
        effect: async (
            { payload },
            { cancelActiveListeners, dispatch, signal },
        ) => {
            cancelActiveListeners()

            let ctx = BaseContext.withData("db", undefined).withSignal(signal)

            if (payload.memo.content) {
                let updated = await memoStorage.updateMemoContent(ctx, {
                    id: payload.memo.id,
                    ...payload.memo.content,
                })
                if (!updated.ok) {
                    dispatch(
                        update.slice.actions.setError({
                            error: updated.err,
                        }),
                    )
                    return
                }
            }

            if (typeof payload.memo.isArchived !== "undefined") {
                let updated = await memoStorage.updateMemoArchiveStatus(ctx, {
                    id: payload.memo.id,
                    isArchived: payload.memo.isArchived,
                })
                if (!updated.ok) {
                    dispatch(
                        update.slice.actions.setError({
                            error: updated.err,
                        }),
                    )
                    return
                }
            }

            if (
                typeof payload.memo.isDeleted !== "undefined" &&
                payload.memo.isDeleted
            ) {
                let deleted = await memoStorage.deleteMemo(ctx, payload.memo.id)
                if (!deleted.ok) {
                    dispatch(
                        update.slice.actions.setError({
                            error: deleted.err,
                        }),
                    )
                    return
                }
            }

            if (
                typeof payload.memo.isDeleted !== "undefined" &&
                !payload.memo.isDeleted
            ) {
                let undeleted = await memoStorage.undeleteMemo(
                    ctx,
                    payload.memo.id,
                )
                if (!undeleted.ok) {
                    dispatch(
                        update.slice.actions.setError({
                            error: undeleted.err,
                        }),
                    )
                    return
                }
            }

            let memo = await memoStorage.getMemo(ctx, payload.memo.id)
            if (!memo.ok) {
                dispatch(
                    update.slice.actions.setError({
                        error: memo.err,
                    }),
                )
                return
            }

            if (payload.memo.isDeleted || payload.memo.isArchived) {
                dispatch(list.slice.actions.removeMemo({ id: payload.memo.id }))
            }

            dispatch(update.slice.actions.setDone())
            dispatch(list.slice.actions.setMemo({ memo: memo.value }))
        },
    })
}
