import type { BackendClient } from "@/backend/BackendClient"
import type { ListMemosQuery, Memo, MemoID, MemoList } from "@/domain/Memo"
import type { Context } from "@/lib/context"
import { Second } from "@/lib/duration"
import { CustomErrCode, isErr } from "@/lib/errors"
import { isEqual } from "@/lib/isEqual"
import { batch, createActions, createEffect, createStore } from "@/lib/store"
import * as create from "./create"
import * as single from "./single"

export const memos = createStore<Memo[]>("memos/memos", [])

export const nextPage = createStore<Date | undefined>("memos/nextPage", undefined)

export const status = createStore<"done" | "page-requested" | "loading" | "error" | undefined>(
    "memos/state",
    undefined,
)

export const error = createStore<Error | undefined>("memos/error", undefined)

export const filter = createStore<ListMemosQuery>("memos/filter", {})

export const isOutdated = createStore("memos/isOutdated", false)

export const actions = createActions({
    loadNextPage: async () => {
        if (!nextPage.state && typeof status.state !== "undefined") {
            return
        }

        status.setState("page-requested")
    },

    setFilter: (newFilter: Partial<ListMemosQuery>, reset = false) => {
        let next = { ...filter.state, ...newFilter }
        if (isEqual(filter.state, next)) {
            return
        }

        batch(() => {
            memos.setState([])
            nextPage.setState(undefined)
            filter.setState(next)
            if (reset) {
                status.setState(undefined)
            } else {
                status.setState("page-requested")
            }
        })
    },

    reload: () =>
        batch(() => {
            isOutdated.setState(false)
            memos.setState([])
            status.setState("page-requested")
        }),
})

const _actions = createActions({
    appendMemos: (list: MemoList) => {
        memos.setState((prev) => [...prev, ...list.items])
        nextPage.setState(list.next)
        status.setState("done")
        error.setState(undefined)
    },

    prepend: (memo: Memo) => {
        memos.setState((prev) => {
            return [memo, ...prev]
        })
    },

    setMemo: (memo: Memo) => {
        let index = memos.state.findIndex((m) => m.id === memo.id)
        if (index === -1) {
            return
        }

        memos.setState((prev) => {
            let next = [...prev]
            next[index] = memo
            return next
        })
    },

    removeMemo: (id: MemoID) => {
        memos.setState((prev) => {
            return prev.filter((m) => m.id !== id)
        })
    },

    updateMemo: (update: typeof single.lastUpdate.state) => {
        if (!update) {
            return
        }

        if (update.updated === "isArchived") {
            if (filter.state.isArchived && !update.memo.isArchived) {
                _actions.removeMemo(update.memo.id)
            }

            if (!filter.state.isArchived && update.memo.isArchived) {
                _actions.removeMemo(update.memo.id)
            }

            return
        }

        if (update.updated === "isDeleted") {
            if (filter.state.isDeleted && !update.memo.isDeleted) {
                _actions.removeMemo(update.memo.id)
            }

            if (!filter.state.isDeleted && update.memo.isDeleted) {
                _actions.removeMemo(update.memo.id)
            }

            return
        }

        if (update.updated === "content" && update.memo.content?.content) {
            let index = memos.state.findIndex((m) => m.id === update.memo.id)
            if (index === -1) {
                return
            }

            let memo = { ...memos.state[index] }
            memo.content = update.memo.content?.content

            memos.setState((prev) => {
                let next = [...prev]
                next[index] = memo
                return next
            })

            return
        }
    },

    setIsLoading: () => {
        status.setState("loading")
        error.setState(undefined)
    },

    setError: (err: Error) => {
        status.setState("error")
        error.setState(err)
    },

    markListAsOutdated: () => isOutdated.setState(true),
})

export const selectors = {
    isLoading: (s: typeof status.state) => s === "loading" || s === "page-requested",
    hasNextPage: (n: typeof nextPage.state) => typeof n !== "undefined",
    filter:
        <K extends keyof typeof filter.state>(key: K) =>
        (filters: typeof filter.state) =>
            filters[key],
}

const pageSize = 10

class NewerMemosLoadRequestError extends Error {
    public [CustomErrCode] = "NewerMemosLoadRequestError"
}

export function registerEffects(backend: BackendClient) {
    let loadAbortCntrl: AbortController | undefined

    createEffect("memos/load", {
        fn: async (baseCtx: Context, { batch }) => {
            batch(() => _actions.setIsLoading())

            loadAbortCntrl?.abort(new NewerMemosLoadRequestError())
            loadAbortCntrl = new AbortController()

            let [ctx, cancel] = baseCtx.withSignal(loadAbortCntrl.signal).withTimeout(Second * 2)
            let [list, err] = await backend.memos.listMemos(ctx, {
                filter: filter.state,
                pagination: {
                    after: nextPage.state,
                    pageSize,
                },
            })

            err = err || ctx.err()
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

    createEffect("memos/addCreatedToList", {
        fn: async (_: Context, { batch }) => {
            let lastCreated = create.lastCreatedMemo.state
            if (!lastCreated) {
                return
            }

            batch(() => _actions.prepend(lastCreated))
        },
        deps: [create.lastCreatedMemo],
        precondition: () =>
            typeof create.lastCreatedMemo.state !== "undefined" && noActiveFilters(filter.state),
        eager: false,
        autoMount: true,
    })

    createEffect("memos/updateMemoInList", {
        fn: async (_: Context, { batch }) => {
            batch(() => _actions.updateMemo(single.lastUpdate.state))
        },
        deps: [single.lastUpdate],
        precondition: () => typeof single.lastUpdate.state !== "undefined",
        eager: false,
        autoMount: true,
    })

    backend.addEventListener("memos/updated", ({ memo }) => {
        _actions.setMemo(memo)
    })

    backend.addEventListener("memos/created", () => {
        _actions.markListAsOutdated()
    })
}

if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
        if (!newModule) {
            return
        }

        newModule.list.setState(memos.state)
        newModule.listState.setState(status.state)
        newModule.listError.setState(error.state)
        newModule.listFilter.setState(filter.state)
        newModule.isOutdated.setState(isOutdated.state)
    })
}

function noActiveFilters(filter: ListMemosQuery): boolean {
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
