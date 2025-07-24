import type { BackendClient } from "@/backend/BackendClient"
import type { MemoContentChanges } from "@/domain/Changelog"
import type { Memo, MemoID } from "@/domain/Memo"
import { batch, createActions, createEffect, createStore } from "@/lib/store"

import { Second } from "@/lib/duration"
import { CustomErrCode, isErr } from "@/lib/errors"
import * as list from "./memos"

export const singleID = createStore<MemoID | undefined>("memos/single/id", undefined)

export const single = createStore<Memo | undefined>("memos/single", undefined)

export const status = createStore<undefined | "done" | "loading" | "updating" | "error">(
    "memos/single/status",
    undefined,
)

export const error = createStore<Error | undefined>("memos/single/error", undefined)

export const lastUpdate = createStore<
    | undefined
    | {
          updated: "content"
          memo: {
              id: MemoID
              content?: {
                  content: string
              }
          }
      }
    | {
          updated: "isArchived"
          memo: {
              id: MemoID
              isArchived: boolean
          }
      }
    | {
          updated: "isDeleted"
          memo: {
              id: MemoID
              isDeleted: boolean
          }
      }
>("memos/single/lastUpdate", undefined)

type UpdateMemoRequest =
    | {
          id: MemoID
          content?: {
              content: string
              changes: MemoContentChanges
          }
      }
    | {
          id: MemoID
          isArchived: boolean
      }
    | {
          id: MemoID
          isDeleted: boolean
      }

export const updateRequest = createStore<UpdateMemoRequest | undefined>(
    "memos/single/updateRequest",
    undefined,
)

export const actions = createActions({
    setSingleID: (id: MemoID) => {
        if (id === singleID.state) {
            return
        }

        let memo = list.memos.state.find((m) => m.id === id)
        if (memo) {
            batch(() => {
                singleID.setState(id)
                status.setState("done")
                error.setState(undefined)
                single.setState(memo)
            })
            return
        }

        batch(() => {
            singleID.setState(id)
            status.setState("loading")
            error.setState(undefined)
            single.setState(undefined)
        })
    },

    updateMemoContent(memo: {
        id: MemoID
        content?: {
            content: string
            changes: MemoContentChanges
        }
    }) {
        batch(() => {
            error.setState(undefined)
            status.setState("updating")
            updateRequest.setState(memo)
        })
    },

    updateMemoArchiveStatus(id: MemoID, isArchived: boolean) {
        batch(() => {
            status.setState("updating")
            error.setState(undefined)
            updateRequest.setState({
                id,
                isArchived,
            })
        })
    },

    updateMemoDeleteStatus(id: MemoID, isDeleted: boolean) {
        batch(() => {
            status.setState("updating")
            error.setState(undefined)
            updateRequest.setState({
                id,
                isDeleted,
            })
        })
    },
})

const _actions = createActions({
    setError: (err: Error) => {
        status.setState("error")
        error.setState(err)
        updateRequest.setState(undefined)
        lastUpdate.setState(undefined)
    },

    setLoadedMemo: (memo: Memo) => {
        single.setState(memo)
        status.setState("done")
        error.setState(undefined)
    },

    setUpdateDone: (req: UpdateMemoRequest) => {
        updateRequest.setState(undefined)
        status.setState("done")
        error.setState(undefined)

        let memo = single.state

        if ("content" in req && req.content) {
            lastUpdate.setState({ updated: "content", memo: req })
            if (memo && memo.id === req.id && req.content.content) {
                single.setState({ ...memo, content: req.content.content })
            }
        } else if ("isArchived" in req) {
            lastUpdate.setState({ updated: "isArchived", memo: req })
            if (memo && memo.id === req.id) {
                single.setState({ ...memo, isArchived: req.isArchived })
            }
        } else if ("isDeleted" in req) {
            lastUpdate.setState({ updated: "isDeleted", memo: req })
            if (memo && memo.id === req.id) {
                single.setState({ ...memo, isDeleted: req.isDeleted })
            }
        } else {
            lastUpdate.setState(undefined)
        }
    },
})

export const selectors = {
    isLoading: (state: typeof status.state) => state === "loading" || state === "updating",
}

class NewerSingleLoadRequestError extends Error {
    public [CustomErrCode] = "NewerSingleLoadRequestError"
}

export function registerEffects(backend: BackendClient) {
    let loadAbortCntrl: AbortController | undefined = undefined

    createEffect("memos/single/load", {
        fn: async (baseCtx, { batch }) => {
            let requestedID = singleID.state
            if (status.state !== "loading" || !requestedID) {
                return
            }

            loadAbortCntrl?.abort(new NewerSingleLoadRequestError())
            loadAbortCntrl = new AbortController()

            let [ctx, cancel] = baseCtx.withSignal(loadAbortCntrl.signal).withTimeout(Second * 5)
            let [memo, err] = await backend.memos.getMemo(ctx, requestedID)

            err = err || ctx.err()

            cancel()

            if (err) {
                if (isErr(err, NewerSingleLoadRequestError)) {
                    return
                }

                batch(() => _actions.setError(err))
                return
            }

            batch(() => _actions.setLoadedMemo(memo))
        },
        autoMount: true,
        deps: [status],
        precondition: () => status.state === "loading" && typeof singleID.state !== "undefined",
        eager: false,
    })

    createEffect("memos/single/updated", {
        fn: async (ctx, { batch }) => {
            let req = updateRequest.state
            if (!req || !selectors.isLoading(status.state)) {
                return
            }

            if ("content" in req && req.content) {
                let [, err] = await backend.memos.updateMemoContent(ctx, {
                    id: req.id,
                    ...req.content,
                })
                if (err) {
                    batch(() => {
                        status.setState("error")
                        error.setState(err)
                    })
                    return
                }
            }

            if ("isArchived" in req) {
                let [, err] = await backend.memos.updateMemoArchiveStatus(ctx, {
                    id: req.id,
                    isArchived: req.isArchived,
                })
                if (err) {
                    batch(() => _actions.setError(err))
                    return
                }
            }

            if ("isDeleted" in req && req.isDeleted) {
                let [, err] = await backend.memos.deleteMemo(ctx, req.id)
                if (err) {
                    batch(() => _actions.setError(err))
                    return
                }
            }

            if ("isDeleted" in req && !req.isDeleted) {
                let [, err] = await backend.memos.undeleteMemo(ctx, req.id)
                if (err) {
                    batch(() => _actions.setError(err))
                    return
                }
            }

            batch(() => _actions.setUpdateDone(req))
        },
        autoMount: true,
        deps: [updateRequest, status],
        precondition: () =>
            typeof updateRequest.state !== "undefined" && status.state === "updating",
        eager: false,
    })
}

if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
        if (!newModule) {
            return
        }

        newModule.singleID.setState(singleID.state)
        newModule.single.setState(single.state)
        newModule.status.setState(status.state)
        newModule.updateRequest.setState(updateRequest.state)
    })
}
