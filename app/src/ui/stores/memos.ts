import type { BackendClient } from "@/backend/BackendClient"
import type { ListMemosQuery, Memo, MemoID, MemoList } from "@/domain/Memo"
import type { Context } from "@/lib/context"
import { Second } from "@/lib/duration"
import { CustomErrCode, isErr } from "@/lib/errors"
import { isEqual } from "@/lib/isEqual"
import { batch, createActions, createDerived, createEffect, createStore } from "@/lib/store"

import * as create from "./create"
import { currentParams } from "./navigation"
import * as single from "./single"

export const memos = createStore<Memo[]>("memos/memos", [])

export const nextPage = createStore<Date | undefined>("memos/nextPage", undefined)

export const status = createStore<"done" | "page-requested" | "loading" | "error" | undefined>(
    "memos/state",
    undefined,
)

export const error = createStore<Error | undefined>("memos/error", undefined)

export const [filter] = createDerived<ListMemosQuery>("memos/filter", {
    fn: () =>
        "filter" in currentParams.state && currentParams.state.filter
            ? currentParams.state.filter
            : {},
    deps: [currentParams],
    autoMount: true,
})

export const isOutdated = createStore("memos/isOutdated", false)

export const actions = createActions({
    loadNextPage: async () => {
        if (!nextPage.state && typeof status.state !== "undefined") {
            return
        }

        status.setState("page-requested")
    },

    reload: () =>
        batch(() => {
            isOutdated.setState(false)
            memos.setState([])
            nextPage.setState(undefined)
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
            let isArchivedFilter = filter.state.isArchived
            if (isArchivedFilter && !update.memo.isArchived) {
                _actions.removeMemo(update.memo.id)
            } else if (!isArchivedFilter && update.memo.isArchived) {
                _actions.removeMemo(update.memo.id)
            }

            return
        }

        if (update.updated === "isDeleted") {
            let isDeletedFilter = filter.state.isDeleted
            if (isDeletedFilter && !update.memo.isDeleted) {
                _actions.removeMemo(update.memo.id)
            }

            if (!isDeletedFilter && update.memo.isDeleted) {
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
        <K extends keyof ListMemosQuery>(key: K) =>
        (f: typeof filter.state) =>
            f[key],
}

const pageSize = 10

class NewerMemosLoadRequestError extends Error {
    public [CustomErrCode] = "NewerMemosLoadRequestError"
}

export function registerEffects(backend: BackendClient) {
    let loadAbortCntrl: AbortController | undefined

    createEffect("memos/filterFromPageParams", {
        fn: async (_, { batch }) => {
            if (isEqual(filter.prevState, filter.state)) {
                return
            }
            batch(() => {
                memos.setState([])
                nextPage.setState(undefined)
                status.setState("page-requested")
            })
        },
        deps: [filter],
        autoMount: true,
    })

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

        newModule.memos.setState(memos.state)
        newModule.status.setState(status.state)
        newModule.error.setState(error.state)
        // newModule.filter.setState(filter.state)
        newModule.isOutdated.setState(isOutdated.state)
    })
}

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
