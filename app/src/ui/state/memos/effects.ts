import type { MemoController } from "@/control/MemoController"
import { BaseContext } from "@/lib/context"
import type { RootStore, StartListening } from "@/ui/state/rootStore"

import * as create from "./create"
import * as list from "./list"
import * as single from "./single"
import * as update from "./update"

import { isEqual } from "@/lib/isEqual"
import { actions as navigation } from "../navigation"
import { selectors } from "./selectors"

const pageSize = 25

export const registerEffects = (
    startListening: StartListening,
    {
        memoCtrl,
        rootStore,
    }: {
        memoCtrl: MemoController
        rootStore: RootStore
    },
) => {
    memoCtrl.addEventListener("onMemoChange", ({ memo }) => {
        rootStore.dispatch(list.slice.actions.setMemo({ memo }))
    })

    memoCtrl.addEventListener("onMemoCreated", () => {
        rootStore.dispatch(
            list.slice.actions.setIsListOutdated({ isListOutdated: true }),
        )
    })

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
        actionCreator: list.slice.actions.reload,
        effect: async (_, { cancelActiveListeners, dispatch }) => {
            cancelActiveListeners()
            dispatch(list.slice.actions.nextPage())
        },
    })

    startListening({
        predicate: (action, currentState, originalState) => {
            if (
                action.type !== list.slice.actions.setFilter.type &&
                action.type !== list.slice.actions.setTagFilter.type
            ) {
                return false
            }
            return (
                currentState.memos.list.filter !==
                originalState.memos.list.filter
            )
        },
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

            let [memos, err] = await memoCtrl.listMemos(
                BaseContext.withSignal(signal),
                {
                    filter,
                    pagination,
                },
            )

            if (err) {
                dispatch(
                    list.slice.actions.setError({
                        error: err,
                    }),
                )
                return
            }

            if (signal.aborted) {
                return
            }

            dispatch(list.slice.actions.appendMemos(memos))
        },
    })

    startListening({
        actionCreator: create.slice.actions.create,
        effect: async (
            { payload },
            { cancelActiveListeners, getState, dispatch, signal },
        ) => {
            cancelActiveListeners()

            let [created, err] = await memoCtrl.createMemo(
                BaseContext.withSignal(signal),
                payload.memo,
            )

            if (err) {
                dispatch(
                    create.slice.actions.setError({
                        error: err,
                    }),
                )
                return
            }

            let state = getState()

            dispatch(create.slice.actions.setDone({ memo: created }))
            if (Object.keys(selectors.filter(state)).length === 0) {
                dispatch(list.slice.actions.prependMemo({ memo: created }))
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

            let foundInList = list.slice.selectors.getMemo(
                state.memos,
                payload.id,
            )
            if (foundInList) {
                dispatch(
                    single.slice.actions.setCurrentSingleMemo({
                        memo: foundInList,
                    }),
                )
                return
            }

            dispatch(single.slice.actions.startLoadingSingleMemo())

            let ctx = BaseContext.withSignal(signal)

            let [memo, err] = await memoCtrl.getMemo(ctx, payload.id)
            if (err) {
                dispatch(
                    single.slice.actions.setError({
                        error: err,
                    }),
                )
                return
            }

            dispatch(single.slice.actions.setCurrentSingleMemo({ memo: memo }))
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
                let [_, err] = await memoCtrl.updateMemoContent(ctx, {
                    id: payload.memo.id,
                    ...payload.memo.content,
                })
                if (err) {
                    dispatch(
                        update.slice.actions.setError({
                            error: err,
                        }),
                    )
                    return
                }
            }

            if (typeof payload.memo.isArchived !== "undefined") {
                let [_, err] = await memoCtrl.updateMemoArchiveStatus(ctx, {
                    id: payload.memo.id,
                    isArchived: payload.memo.isArchived,
                })
                if (err) {
                    dispatch(
                        update.slice.actions.setError({
                            error: err,
                        }),
                    )
                    return
                }
            }

            if (
                typeof payload.memo.isDeleted !== "undefined" &&
                payload.memo.isDeleted
            ) {
                let [_, err] = await memoCtrl.deleteMemo(ctx, payload.memo.id)
                if (err) {
                    dispatch(
                        update.slice.actions.setError({
                            error: err,
                        }),
                    )
                    return
                }
            }

            if (
                typeof payload.memo.isDeleted !== "undefined" &&
                !payload.memo.isDeleted
            ) {
                let [_, err] = await memoCtrl.undeleteMemo(ctx, payload.memo.id)
                if (err) {
                    dispatch(
                        update.slice.actions.setError({
                            error: err,
                        }),
                    )
                    return
                }
            }

            let [memo, err] = await memoCtrl.getMemo(ctx, payload.memo.id)
            if (err) {
                dispatch(
                    update.slice.actions.setError({
                        error: err,
                    }),
                )
                return
            }

            if (payload.memo.isDeleted || payload.memo.isArchived) {
                dispatch(list.slice.actions.removeMemo({ id: payload.memo.id }))
            }

            dispatch(update.slice.actions.setDone())
            dispatch(list.slice.actions.setMemo({ memo: memo }))
        },
    })

    startListening({
        actionCreator: navigation.setPage,
        effect: async (
            { payload },
            { cancelActiveListeners, dispatch, getState },
        ) => {
            cancelActiveListeners()
            let state = getState()

            if ("filter" in payload.params) {
                let filter = list.slice.selectors.filter(state.memos)
                let paramFilter = payload.params?.filter ?? {}
                if (!isEqual(filter, paramFilter)) {
                    dispatch(
                        list.slice.actions.setFilter({
                            filter: paramFilter,
                            source: "navigation",
                        }),
                    )
                }
            }

            if ("memoID" in payload.params) {
                if (
                    single.slice.selectors.currentMemoID(state.memos) !==
                    payload.params.memoID
                ) {
                    dispatch(
                        single.slice.actions.setCurrentSingleMemoID({
                            id: payload.params.memoID as string,
                        }),
                    )
                }
            }
        },
    })

    startListening({
        actionCreator: navigation.init,
        effect: async (
            { payload },
            { cancelActiveListeners, dispatch, getState },
        ) => {
            cancelActiveListeners()
            let state = getState()

            if ("filter" in payload.params) {
                let filter = list.slice.selectors.filter(state.memos)
                let paramFilter = payload.params?.filter ?? {}
                if (!isEqual(filter, paramFilter)) {
                    dispatch(
                        list.slice.actions.setFilter({
                            filter: paramFilter,
                            source: "navigation",
                        }),
                    )
                }
            }

            if ("memoID" in payload.params) {
                if (
                    single.slice.selectors.currentMemoID(state.memos) !==
                    payload.params.memoID
                ) {
                    dispatch(
                        single.slice.actions.setCurrentSingleMemoID({
                            id: payload.params.memoID as string,
                        }),
                    )
                }
            }
        },
    })
}
