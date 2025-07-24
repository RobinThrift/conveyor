import type { BackendClient } from "@/backend/BackendClient"
import type { Memo, MemoID } from "@/domain/Memo"
import type { Context } from "@/lib/context"
import { batch, createActions, createEffect, createStore } from "@/lib/store"

export type CreateMemoRequest = {
    id?: MemoID
    content: string
    createdAt?: Date
}

export const status = createStore<undefined | "requested" | "loading" | "done" | "error">(
    "memos/create/status",
    undefined,
)

export const error = createStore<Error | undefined>("memos/create/error", undefined)

export const lastCreatedMemo = createStore<Memo | undefined>(
    "memos/create/lastCreatedMemo",
    undefined,
)

const request = createStore<CreateMemoRequest | undefined>("memos/create/request", undefined)

export const actions = createActions({
    createMemo: (req: CreateMemoRequest) =>
        batch(() => {
            status.setState("requested")
            error.setState(undefined)
            request.setState(req)
            lastCreatedMemo.setState(undefined)
        }),
})

const _actions = createActions({
    setIsLoading: () => {
        status.setState("loading")
        error.setState(undefined)
        lastCreatedMemo.setState(undefined)
    },
    setError: (err: Error) => {
        status.setState("error")
        error.setState(err)
        lastCreatedMemo.setState(undefined)
    },
    setDone: (created: Memo) => {
        status.setState("done")
        lastCreatedMemo.setState(created)
        request.setState(undefined)
        error.setState(undefined)
    },
})

export const selectors = {
    isCreatingMemo: (state: typeof status.state) => state === "requested" || state === "loading",
}

export function registerEffects(backend: BackendClient) {
    createEffect("memos/create", {
        fn: async (ctx: Context, { batch }) => {
            let req = request.state
            if (!req) {
                return
            }

            batch(() => {
                _actions.setIsLoading()
            })

            let [created, err] = await backend.memos.createMemo(ctx, req)
            if (err) {
                batch(() => {
                    _actions.setError(err)
                })

                return
            }

            batch(() => {
                _actions.setDone(created)
            })
        },
        autoMount: true,
        deps: [status, request],
        precondition: () => status.state === "requested" && typeof request.state !== "undefined",
        eager: false,
    })
}
