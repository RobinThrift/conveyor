import type { BackendClient } from "@/backend/BackendClient"
import type { MemoContentChanges } from "@/domain/Changelog"
import { newID } from "@/domain/ID"
import type { Memo, MemoID } from "@/domain/Memo"
import type { Context } from "@/lib/context"
import { currentDateTime } from "@/lib/i18n"
import { type AsyncResult, mapResult, Ok } from "@/lib/result"
import { createActions, createEffect, createStore } from "@/lib/store"

type MemoRef = {
    memo: Memo
    count: number
    state: MemoRefState
    isNew: boolean
    error?: Error
    saveRequest?: MemoSaveRequest
}

type MemoSaveRequest =
    | {
          content: string
          changes: MemoContentChanges
      }
    | {
          isArchived: boolean
      }
    | {
          isDeleted: boolean
      }

type MemoRefState = "done" | "editing" | "loading" | "save-requested" | "saving" | "error"

export const refs = createStore<Record<MemoID, MemoRef>>("memos/refs", {})

export const actions = createActions({
    addMemoRefs: (memos: Memo[]) => {
        let nextRefs = { ...refs.state }
        for (let m of memos) {
            if (!nextRefs[m.id]) {
                nextRefs[m.id] = {
                    memo: m,
                    count: 1,
                    state: "done",
                    isNew: false,
                }
                continue
            }

            nextRefs[m.id].count++
            if (nextRefs[m.id].state === "done") {
                nextRefs[m.id].memo = m
            }
        }
        refs.setState(nextRefs)
    },

    incMemoRef: (memoID: MemoID) => {
        let nextRefs = { ...refs.state }
        if (!nextRefs[memoID]) {
            return
        }
        nextRefs[memoID] = {
            ...nextRefs[memoID],
            count: nextRefs[memoID].count + 1,
        }

        refs.setState(nextRefs)
    },

    decMemoRef: (memoID: MemoID) => {
        let nextRefs = { ...refs.state }
        if (!nextRefs[memoID]) {
            return
        }
        nextRefs[memoID] = {
            ...nextRefs[memoID],
            count: nextRefs[memoID].count - 1,
        }

        if (nextRefs[memoID].count <= 0) {
            delete nextRefs[memoID]
        }

        refs.setState(nextRefs)
    },

    removeMemoRefs: (memoIDs: MemoID[]) => {
        let nextRefs = { ...refs.state }
        for (let id of memoIDs) {
            if (!nextRefs[id]) {
                continue
            }

            nextRefs[id].count--
            if (nextRefs[id].count <= 0) {
                delete nextRefs[id]
            }
        }
        refs.setState(nextRefs)
    },

    setMemoStates: (memos: { id: MemoID; state: MemoRefState; error?: Error }[]) => {
        let nextRefs = { ...refs.state }
        for (let { id, state, error } of memos) {
            let ref = nextRefs[id]
            if (!ref) {
                continue
            }

            nextRefs[id] = { ...ref, state, isNew: false, error }
        }

        refs.setState(nextRefs)
    },

    newMemo: () => {
        let memo = {
            id: newID(),
            content: "",
            isArchived: false,
            isDeleted: false,
            createdAt: currentDateTime(),
            updatedAt: currentDateTime(),
        }

        let nextRefs = {
            ...refs.state,
            [memo.id]: {
                memo,
                count: 1,
                isNew: true,
                state: "editing",
            },
        } satisfies typeof refs.state

        refs.setState(nextRefs)

        return memo
    },

    startEdit: (memoID: MemoID) => {
        let nextRefs = {
            ...refs.state,
        }

        let ref = nextRefs[memoID]
        if (!ref) {
            return
        }

        nextRefs[memoID] = { ...ref, state: "editing" }

        refs.setState(nextRefs)
    },

    cancelEdit: (memoID: MemoID) => {
        let nextRefs = {
            ...refs.state,
        }

        let ref = nextRefs[memoID]
        if (!ref) {
            return
        }

        if (ref.isNew) {
            delete nextRefs[memoID]
        } else {
            nextRefs[memoID] = { ...ref, state: "done" }
        }

        refs.setState(nextRefs)
    },

    updateContent: (memo: Memo, changes: MemoContentChanges) => {
        let ref = refs.state[memo.id]
        if (!ref) {
            return
        }

        refs.setState({
            ...refs.state,
            [memo.id]: {
                ...ref,
                memo,
                saveRequest: {
                    content: memo.content,
                    changes,
                },
                state: "save-requested",
            },
        })
    },

    delete: (memoID: MemoID) => {
        let ref = refs.state[memoID]
        if (!ref) {
            return
        }

        refs.setState({
            ...refs.state,
            [memoID]: {
                ...ref,
                memo: {
                    ...ref.memo,
                    isDeleted: true,
                },
                saveRequest: { isDeleted: true },
                state: "save-requested",
            },
        })
    },

    undelete: (memoID: MemoID) => {
        let ref = refs.state[memoID]
        if (!ref) {
            return
        }

        refs.setState({
            ...refs.state,
            [memoID]: {
                ...ref,
                memo: {
                    ...ref.memo,
                    isDeleted: false,
                },
                saveRequest: { isDeleted: false },
                state: "save-requested",
            },
        })
    },

    setArchiveStatus: (memoID: MemoID, isArchived: boolean) => {
        let ref = refs.state[memoID]
        if (!ref) {
            return
        }

        refs.setState({
            ...refs.state,
            [memoID]: {
                ...ref,
                memo: {
                    ...ref.memo,
                    isArchived,
                },
                saveRequest: { isArchived },
                state: "save-requested",
            },
        })
    },
})

const _actions = createActions({
    updateMemo: (memo: Memo) => {
        let nextRefs = { ...refs.state }
        if (!nextRefs[memo.id]) {
            return
        }

        if (nextRefs[memo.id].state === "editing") {
            return
        }

        nextRefs[memo.id] = {
            ...nextRefs[memo.id],
            memo,
        }

        refs.setState(nextRefs)
    },

    setRef: (ref: MemoRef) => {
        refs.setState({ ...refs.state, [ref.memo.id]: { ...ref } })
    },
    // appendMemos: (list: MemoList) => {
    //     memos.setState((prev) => [...prev, ...list.items])
    //     nextPage.setState(list.next)
    //     status.setState("done")
    //     error.setState(undefined)
    // },
    //
    // prepend: (memo: Memo) => {
    //     memos.setState((prev) => {
    //         return [memo, ...prev]
    //     })
    // },
    //
    // setMemo: (memo: Memo) => {
    //     let index = memos.state.findIndex((m) => m.id === memo.id)
    //     if (index === -1) {
    //         return
    //     }
    //
    //     memos.setState((prev) => {
    //         let next = [...prev]
    //         next[index] = memo
    //         return next
    //     })
    // },
    //
    // removeMemo: (id: MemoID) => {
    //     memos.setState((prev) => {
    //         return prev.filter((m) => m.id !== id)
    //     })
    // },
    //
    // updateMemo: (update: typeof single.lastUpdate.state) => {
    //     if (!update) {
    //         return
    //     }
    //
    //     if (update.updated === "isArchived") {
    //         let isArchivedFilter = filter.state.isArchived
    //         if (isArchivedFilter && !update.memo.isArchived) {
    //             _actions.removeMemo(update.memo.id)
    //         } else if (!isArchivedFilter && update.memo.isArchived) {
    //             _actions.removeMemo(update.memo.id)
    //         }
    //
    //         return
    //     }
    //
    //     if (update.updated === "isDeleted") {
    //         let isDeletedFilter = filter.state.isDeleted
    //         if (isDeletedFilter && !update.memo.isDeleted) {
    //             _actions.removeMemo(update.memo.id)
    //         }
    //
    //         if (!isDeletedFilter && update.memo.isDeleted) {
    //             _actions.removeMemo(update.memo.id)
    //         }
    //
    //         return
    //     }
    //
    //     if (update.updated === "content" && update.memo.content?.content) {
    //         let index = memos.state.findIndex((m) => m.id === update.memo.id)
    //         if (index === -1) {
    //             return
    //         }
    //
    //         let memo = { ...memos.state[index] }
    //         memo.content = update.memo.content?.content
    //
    //         memos.setState((prev) => {
    //             let next = [...prev]
    //             next[index] = memo
    //             return next
    //         })
    //
    //         return
    //     }
    // },
    //
    // setIsLoading: () => {
    //     status.setState("loading")
    //     error.setState(undefined)
    // },
    //
    // setError: (err: Error) => {
    //     status.setState("error")
    //     error.setState(err)
    // },
    //
    // markListAsOutdated: () => isOutdated.setState(true),
})

export const selectors = {
    get: (id: MemoID) => (s: typeof refs.state) => s[id].memo,
    isEditing: (id: MemoID) => (s: typeof refs.state) => s[id].state === "editing",
    ieNew: (id: MemoID) => (s: typeof refs.state) => s[id].isNew,
    // isLoading: (s: typeof status.state) => s === "loading" || s === "page-requested",
    // hasNextPage: (n: typeof nextPage.state) => typeof n !== "undefined",
    // filter:
    //     <K extends keyof ListMemosQuery>(key: K) =>
    //     (f: typeof filter.state) =>
    //         f[key],
}

// const pageSize = 10
//
// class NewerMemosLoadRequestError extends Error {
//     public [CustomErrCode] = "NewerMemosLoadRequestError"
// }

export function registerEffects(backend: BackendClient) {
    let createOrUpdateMemo = createMemoCreatorUpdater(backend.memos)

    createEffect("memos/saveMemo", {
        fn: async (ctx, { batch }) => {
            let toSave = Object.values(refs.state).filter((r) => r.state === "save-requested")
            if (toSave.length === 0) {
                return
            }

            batch(() =>
                actions.setMemoStates(toSave.map((r) => ({ id: r.memo.id, state: "saving" }))),
            )

            for (let ref of toSave) {
                let [, err] = await createOrUpdateMemo(ctx, ref)
                if (err) {
                    batch(() => _actions.setRef({ ...ref, state: "error", error: err }))
                    continue
                }
                batch(() => _actions.setRef({ ...ref, isNew: false, state: "done" }))
            }
        },
        precondition: () =>
            typeof Object.values(refs.state).filter((r) => r.state === "save-requested") !==
            "undefined",
        deps: [refs],
        autoMount: true,
    })

    // let loadAbortCntrl: AbortController | undefined
    //
    // createEffect("memos/filterFromPageParams", {
    //     fn: async (_, { batch }) => {
    //         if (isEqual(filter.prevState, filter.state)) {
    //             return
    //         }
    //         batch(() => {
    //             memos.setState([])
    //             nextPage.setState(undefined)
    //             status.setState("page-requested")
    //         })
    //     },
    //     deps: [filter],
    //     autoMount: true,
    // })
    //
    // createEffect("memos/load", {
    //     fn: async (baseCtx: Context, { batch }) => {
    //         batch(() => _actions.setIsLoading())
    //
    //         loadAbortCntrl?.abort(new NewerMemosLoadRequestError())
    //         loadAbortCntrl = new AbortController()
    //
    //         let [ctx, cancel] = baseCtx.withSignal(loadAbortCntrl.signal).withTimeout(Second * 2)
    //         let [list, err] = await backend.memos.listMemos(ctx, {
    //             filter: filter.state,
    //             pagination: {
    //                 after: nextPage.state,
    //                 pageSize,
    //             },
    //         })
    //
    //         err = err || ctx.err()
    //         cancel()
    //
    //         if (err) {
    //             if (isErr(err, NewerMemosLoadRequestError)) {
    //                 return
    //             }
    //
    //             batch(() => _actions.setError(err))
    //             return
    //         }
    //
    //         batch(() => _actions.appendMemos(list))
    //     },
    //     deps: [status],
    //     precondition: () => status.state === "page-requested",
    //     eager: false,
    //     autoMount: true,
    // })
    // createEffect("memos/addCreatedToList", {
    //     fn: async (_: Context, { batch }) => {
    //         let lastCreated = create.lastCreatedMemo.state
    //         if (!lastCreated) {
    //             return
    //         }
    //
    //         batch(() => _actions.prepend(lastCreated))
    //     },
    //     deps: [create.lastCreatedMemo],
    //     precondition: () =>
    //         typeof create.lastCreatedMemo.state !== "undefined" && noActiveFilters(filter.state),
    //     eager: false,
    //     autoMount: true,
    // })
    //
    // createEffect("memos/updateMemoInList", {
    //     fn: async (_: Context, { batch }) => {
    //         batch(() => _actions.updateMemo(single.lastUpdate.state))
    //     },
    //     deps: [single.lastUpdate],
    //     precondition: () => typeof single.lastUpdate.state !== "undefined",
    //     eager: false,
    //     autoMount: true,
    // })

    backend.addEventListener("memos/updated", ({ memo }) => {
        _actions.updateMemo(memo)
    })

    // backend.addEventListener("memos/created", () => {
    //     _actions.markListAsOutdated()
    // })
}

function createMemoCreatorUpdater(backend: BackendClient["memos"]) {
    return async (ctx: Context, ref: MemoRef): AsyncResult<void> => {
        if (ref.isNew) {
            return mapResult(await backend.createMemo(ctx, ref.memo), () => undefined)
        }

        if (ref.saveRequest && "isDeleted" in ref.saveRequest) {
            if (ref.saveRequest.isDeleted) {
                return backend.deleteMemo(ctx, ref.memo.id)
            } else {
                return backend.undeleteMemo(ctx, ref.memo.id)
            }
        }

        if (ref.saveRequest && "isArchived" in ref.saveRequest) {
            return backend.updateMemoArchiveStatus(ctx, {
                id: ref.memo.id,
                isArchived: ref.saveRequest.isArchived,
            })
        }

        if (ref.saveRequest && "content" in ref.saveRequest) {
            return backend.updateMemoContent(ctx, {
                id: ref.memo.id,
                content: ref.memo.content,
                changes: ref.saveRequest.changes,
            })
        }

        return Ok(undefined)
    }
}
