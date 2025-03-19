import type { MemoController } from "@/control/MemoController"
import { BaseContext } from "@/lib/context"
import type { StartListening } from "@/ui/state/rootStore"

import * as create from "./create"
import * as list from "./list"
import * as single from "./single"
import * as update from "./update"

import { actions } from "."
import { selectors } from "./selectors"

const pageSize = 25

export const registerEffects = (
    startListening: StartListening,
    {
        memoCtrl,
    }: {
        memoCtrl: MemoController
    },
) => {
    startListening({
        actionCreator: list.slice.actions.nextPage,
        effect: async (_, { cancelActiveListeners, dispatch, getState }) => {
            cancelActiveListeners()

            let state = getState()

            let hasNextPage = list.slice.selectors.hasNextPage(state.memos)
            if (!hasNextPage) {
                return
            }

            let filter = list.slice.selectors.filter(state.memos)
            let nextPage = list.slice.selectors.nextPage(state.memos)

            dispatch(
                list.slice.actions.loadPage({
                    filter,
                    pagination: {
                        after: nextPage,
                        pageSize,
                    },
                }),
            )
        },
    })

    startListening({
        actionCreator: list.slice.actions.setFilter,
        effect: async (_, { cancelActiveListeners, dispatch, getState }) => {
            cancelActiveListeners()

            let state = getState()

            let isLoading = list.slice.selectors.isLoading(state.memos)
            if (!isLoading) {
                return
            }

            let filter = list.slice.selectors.filter(state.memos)

            dispatch(
                list.slice.actions.loadPage({
                    filter,
                    pagination: {
                        pageSize,
                    },
                }),
            )
        },
    })

    startListening({
        actionCreator: list.slice.actions.loadPage,
        effect: async (
            { payload: { filter, pagination } },
            { cancelActiveListeners, dispatch, signal },
        ) => {
            cancelActiveListeners()

            let memos = await memoCtrl.listMemos(
                BaseContext.withSignal(signal),
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

            let created = await memoCtrl.createMemo(
                BaseContext.withSignal(signal),
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
            { cancelActiveListeners, dispatch, getState, signal },
        ) => {
            let state = getState()
            if (
                selectors.isLoadingSingleMemo(state) &&
                selectors.currentMemoID(state) === payload.id
            ) {
                return
            }

            cancelActiveListeners()

            dispatch(actions.startLoadingSingleMemo())

            let ctx = BaseContext.withSignal(signal)

            let memo = await memoCtrl.getMemo(ctx, payload.id)
            if (!memo.ok) {
                dispatch(
                    single.slice.actions.setError({
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

            let ctx = BaseContext.withSignal(signal)

            if (payload.memo.content) {
                let updated = await memoCtrl.updateMemoContent(ctx, {
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
                let updated = await memoCtrl.updateMemoArchiveStatus(ctx, {
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
                let deleted = await memoCtrl.deleteMemo(ctx, payload.memo.id)
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
                let undeleted = await memoCtrl.undeleteMemo(
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

            let memo = await memoCtrl.getMemo(ctx, payload.memo.id)
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
