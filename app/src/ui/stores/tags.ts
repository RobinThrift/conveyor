import type { BackendClient } from "@/backend/BackendClient"
import type { Tag } from "@/domain/Tag"
import type { Context } from "@/lib/context"
import { CustomErrCode, isErr } from "@/lib/errors"
import { batch, createActions, createEffect, createStore } from "@/lib/store"

import * as create from "./create"
import * as single from "./single"

export const list = createStore<Tag[]>("tags/list", [])

export const state = createStore<undefined | "done" | "loading" | "error">("tags/state", undefined)

export const error = createStore<Error | undefined>("tags/error", undefined)

const requiresReload = createStore("tags/requiresReload", false)

export const actions = createActions({
    loadTags: () => {
        if (state.state === "loading") {
            return
        }

        state.setState("loading")
        error.setState(undefined)
    },

    setRequiresReload: () => {
        requiresReload.setState(true)
        error.setState(undefined)
    },
})

// @TODO: use real pagination
const tagPageSize = 1000

class NewerTagLoadRequestError extends Error {
    public [CustomErrCode] = "NewerTagLoadRequestError"
}

export function registerEffects(backend: BackendClient) {
    let loadAbortCntrl: AbortController | undefined

    createEffect("tags/load", {
        fn: async (baseCtx: Context) => {
            loadAbortCntrl?.abort(new NewerTagLoadRequestError())
            loadAbortCntrl = new AbortController()

            let ctx = baseCtx.withSignal(loadAbortCntrl.signal)
            let [tags, err] = await backend.memos.listTags(ctx, {
                pagination: {
                    pageSize: tagPageSize,
                },
            })

            err = err || ctx.err()

            if (err) {
                if (isErr(err, NewerTagLoadRequestError)) {
                    return
                }

                batch(() => {
                    state.setState("error")
                    error.setState(err)
                })
                return
            }

            batch(() => {
                list.setState(tags.items)
                state.setState("done")
                error.setState(undefined)
            })
        },
        deps: [state],
        precondition: () => state.state === "loading",
        eager: false,
        autoMount: true,
    })

    createEffect("tags/requiresReload", {
        fn: async () => {
            requiresReload.setState(false)
            actions.loadTags()
        },
        deps: [requiresReload],
        precondition: () => requiresReload.state,
        eager: false,
        autoMount: true,
    })

    createEffect("tags/memoCreated", {
        fn: async () => {
            actions.setRequiresReload()
        },
        deps: [create.lastCreatedMemo],
        precondition: () => create.status.state === "done",
        eager: false,
        autoMount: true,
    })

    createEffect("tags/memoUpdated", {
        fn: async () => {
            actions.setRequiresReload()
        },
        deps: [single.updateRequest, single.status],
        precondition: () =>
            typeof single.updateRequest === "undefined" &&
            single.status.prevState === "loading" &&
            single.status.state === "done",
        eager: false,
        autoMount: true,
    })
}

if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
        if (!newModule) {
            return
        }

        newModule.list.setState(list.state)
        newModule.state.setState(state.state)
    })
}
