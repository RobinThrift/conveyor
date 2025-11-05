import type { Temporal } from "temporal-polyfill"

import type { BackendClient } from "@/backend/BackendClient"
import type { ListMemosQuery, Memo, MemoID, MemoList } from "@/domain/Memo"
import type { Context } from "@/lib/context"
import { Second } from "@/lib/duration"
import { CustomErrCode, isErr } from "@/lib/errors"
import { isEqual } from "@/lib/isEqual"
import { batch, createActions, createEffect, createStore } from "@/lib/store"

import * as memos from "./memos"

type MemoListItems = Record<string, { date: Temporal.ZonedDateTime; memos: MemoID[] }>

export const listItems = createStore<MemoListItems>("memoList/items", {})

export const nextPage = createStore<Temporal.ZonedDateTime | undefined>(
    "memoList/nextPage",
    undefined,
)

export const status = createStore<"done" | "page-requested" | "loading" | "error" | undefined>(
    "memoList/state",
    undefined,
)

export const error = createStore<Error | undefined>("memoList/error", undefined)

export const filter = createStore<ListMemosQuery>("memoList/filter", {})

export const isOutdated = createStore("memoList/isOutdated", false)

export const actions = createActions({
    loadNextPage: () => {
        if (!nextPage.state && typeof status.state !== "undefined") {
            return
        }

        status.setState("page-requested")
    },

    reload: () =>
        batch(() => {
            _actions.reset()
            status.setState("page-requested")
        }),

    setFilter: (newFilter: ListMemosQuery) =>
        batch(() => {
            let next = { ...filter.state, ...newFilter }
            if (Object.getOwnPropertyNames(newFilter).length === 0) {
                next = newFilter
            } else if (isEqual(filter.state, next)) {
                return
            }

            _actions.reset()
            filter.setState(next)
            status.setState("page-requested")
        }),
})

const _actions = createActions({
    reset: () => {
        isOutdated.setState(false)
        memos.actions.removeMemoRefs(Object.values(listItems.state).flatMap(({ memos }) => memos))
        listItems.setState({})
        nextPage.setState(undefined)
    },

    setIsLoading: () => {
        status.setState("loading")
        error.setState(undefined)
    },

    setError: (err: Error) => {
        status.setState("error")
        error.setState(err)
    },

    appendMemos: (list: MemoList) => {
        nextPage.setState(list.next)
        status.setState("done")
        error.setState(undefined)

        if (list.items.length === 0) {
            return
        }

        memos.actions.addMemoRefs(list.items)
        let nextGroups = groupMemos(list.items)
        let nextFirstDay = list.items[0].createdAt.toPlainDate().toJSON()
        let nextItems = { ...listItems.state }

        if (nextItems[nextFirstDay]) {
            nextItems[nextFirstDay].memos = [
                ...nextItems[nextFirstDay].memos,
                ...nextGroups[nextFirstDay].memos,
            ]
            delete nextGroups[nextFirstDay]
        }

        nextItems = { ...nextItems, ...nextGroups }

        listItems.setState(nextItems)
    },

    setItems: (list: MemoList) => {
        nextPage.setState(list.next)
        status.setState("done")
        error.setState(undefined)

        memos.actions.removeMemoRefs(Object.values(listItems.state).flatMap(({ memos }) => memos))

        if (list.items.length === 0) {
            listItems.setState({})
            return
        }

        memos.actions.addMemoRefs(list.items)
        let nextItems = groupMemos(list.items)
        listItems.setState(nextItems)
    },

    addMemoToList: (memo: Memo) => {
        if (!noActiveFilters(filter.state)) {
            return
        }

        let nextListItems = { ...listItems.state }

        let memoDay = memo.createdAt.toPlainDate().toJSON()
        if (memoDay in nextListItems) {
            nextListItems[memoDay].memos = [memo.id, ...nextListItems[memoDay].memos]
        } else {
            nextListItems = {
                [memoDay]: { date: memo.createdAt, memos: [memo.id] },
                ...nextListItems,
            }
        }

        listItems.setState(nextListItems)
    },

    markListAsOutdated: () => isOutdated.setState(true),
})

export const selectors = {
    isLoading: (s: typeof status.state) => s === "loading" || s === "page-requested",
    hasNextPage: (n: typeof nextPage.state) => typeof n !== "undefined",
    hasNoActiveFilters: (n: typeof filter.state) => noActiveFilters(n),
    filter:
        <K extends keyof ListMemosQuery>(key: K) =>
        (f: typeof filter.state) =>
            f[key],
}

const pageSize = 12

class NewerMemosLoadRequestError extends Error {
    public [CustomErrCode] = "NewerMemosLoadRequestError"
}

export function registerEffects(backend: BackendClient) {
    let loadAbortCntrl: AbortController | undefined

    createEffect("memoList/loadPage", {
        fn: async (ctx: Context, { batch }) => {
            batch(() => _actions.setIsLoading())

            loadAbortCntrl?.abort(new NewerMemosLoadRequestError())
            loadAbortCntrl = new AbortController()

            let [fetchCtx, cancel] = ctx.withSignal(loadAbortCntrl.signal).withTimeout(Second * 2)
            let [list, err] = await backend.memos.listMemos(fetchCtx, {
                filter: filter.state,
                pagination: {
                    after: nextPage.state,
                    pageSize,
                },
            })

            err = err || fetchCtx.err()
            cancel()

            if (err) {
                if (isErr(err, NewerMemosLoadRequestError)) {
                    return
                }

                batch(() => _actions.setError(err))
                return
            }

            batch(() => _actions.appendMemos(list))
        },
        deps: [status],
        precondition: () => status.state === "page-requested",
        eager: false,
        autoMount: true,
    })

    // createEffect("memos/addCreatedToList", {
    //     fn: async (_: Context, { batch }) => {
    //         let newMemos = Object.values(memos.refs.prevState).filter((r) => r.isNew)
    //
    //         for (let prevRef of newMemos) {
    //             let ref = memos.refs.state[prevRef.memo.id]
    //             if (ref.state !== "done") {
    //                 continue
    //             }
    //
    //             let firstDay = Object.values(listItems.state).at(0)?.date
    //             if (
    //                 !firstDay ||
    //                 (firstDay && firstDay < ref.memo.createdAt) ||
    //                 calendarDateFromDate(ref.memo.createdAt).toString() in listItems.state
    //             ) {
    //                 batch(() => _actions.addMemoToList(ref.memo))
    //             }
    //         }
    //     },
    //     deps: [memos.refs],
    //     precondition: () =>
    //         typeof Object.values(memos.refs.prevState).find((r) => r.isNew) !== "undefined",
    //     eager: false,
    //     autoMount: true,
    // })

    createEffect("memos/changed", {
        fn: async (ctx: Context, { batch }) => {
            let total = Object.values(listItems.state).reduce(
                (total, { memos }) => total + memos.length,
                0,
            )

            batch(() => _actions.setIsLoading())

            loadAbortCntrl?.abort(new NewerMemosLoadRequestError())
            loadAbortCntrl = new AbortController()

            let [fetchCtx, cancel] = ctx.withSignal(loadAbortCntrl.signal).withTimeout(Second * 2)
            let [list, err] = await backend.memos.listMemos(fetchCtx, {
                filter: filter.state,
                pagination: {
                    pageSize: total,
                },
            })

            err = err || fetchCtx.err()
            cancel()

            if (err) {
                if (isErr(err, NewerMemosLoadRequestError)) {
                    return
                }

                batch(() => _actions.setError(err))
                return
            }

            batch(() => _actions.setItems(list))
        },
        deps: [memos.refs],
        precondition: () =>
            typeof Object.values(memos.refs.prevState).find((r) => r.state === "saving") !==
            "undefined",
        eager: false,
        autoMount: true,
    })

    backend.addEventListener("memos/created", ({ memo }) => {
        let firstDay = Object.values(listItems.state).at(0)?.date
        if (
            !firstDay ||
            (firstDay && firstDay < memo.createdAt) ||
            memo.createdAt.toPlainDate().toJSON() in listItems.state
        ) {
            batch(() => _actions.addMemoToList(memo))
            return
        }

        batch(() => _actions.markListAsOutdated())
    })
}

// if (import.meta.hot) {
//     import.meta.hot.accept((newModule) => {
//         if (!newModule) {
//             return
//         }
//
//         newModule.memos.setState(memos.state)
//         newModule.status.setState(status.state)
//         newModule.error.setState(error.state)
//         // newModule.filter.setState(filter.state)
//         newModule.isOutdated.setState(isOutdated.state)
//     })
// }

function noActiveFilters(filter?: ListMemosQuery): boolean {
    if (!filter) {
        return true
    }

    let props = Object.getOwnPropertyNames(filter)
    if (props.length === 0) {
        return true
    }

    for (let prop of props) {
        if (typeof filter[prop as keyof ListMemosQuery] !== "undefined") {
            return false
        }
    }

    return true
}

function groupMemos(memos: Memo[]): MemoListItems {
    let grouped: MemoListItems = {}

    memos.forEach((memo) => {
        let day = memo.createdAt.toPlainDate().toJSON()
        if (!grouped[day]) {
            grouped[day] = { date: memo.createdAt, memos: [] }
        }
        grouped[day].memos.push(memo.id)
    })

    return grouped
}
