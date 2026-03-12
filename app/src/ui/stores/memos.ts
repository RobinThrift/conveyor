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
    startEditAt?: { x?: number; y?: number; snippet?: string; pageTop?: number; pos?: number }
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

    startEdit: (
        memoID: MemoID,
        startEditAt?: { x?: number; y?: number; snippet?: string; pageTop: number; pos?: number },
    ) => {
        let nextRefs = {
            ...refs.state,
        }

        let ref = nextRefs[memoID]
        if (!ref) {
            return
        }

        nextRefs[memoID] = { ...ref, startEditAt, state: "editing" }

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
            nextRefs[memoID] = { ...ref, startEditAt: undefined, state: "done" }
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
                startEditAt: undefined,
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
})

export const selectors = {
    get: (id: MemoID) => (s: typeof refs.state) => s[id].memo,
    isEditing: (id: MemoID) => (s: typeof refs.state) => s[id].state === "editing",
    startEditAt: (id: MemoID) => (s: typeof refs.state) => s[id].startEditAt,
    ieNew: (id: MemoID) => (s: typeof refs.state) => s[id].isNew,
}

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

    backend.addEventListener("memos/updated", ({ memo }) => {
        _actions.updateMemo(memo)
    })
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
