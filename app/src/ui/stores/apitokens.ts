import type { BackendClient } from "@/backend/BackendClient"
import type { APIToken } from "@/domain/APIToken"
import { goBackOnePage } from "@/domain/Pagination"
import type { Context } from "@/lib/context"
import { CustomErrCode, isErr } from "@/lib/errors"
import { batch, createActions, createEffect, createStore } from "@/lib/store"

export const list = createStore<APIToken[]>("apitokens/list", [])

export const pagination = createStore<{
    pages: (string | undefined)[]
    currentPage: string | undefined
    nextPage: string | undefined
    hasNextPage: boolean
}>("apitokens/pagination", {
    pages: [],
    currentPage: undefined,
    nextPage: undefined,
    hasNextPage: true,
})

export const status = createStore<undefined | "done" | "page-requested" | "loading" | "error">(
    "apitokens/state",
    undefined,
)

export const error = createStore<Error | undefined>("apitokens/error", undefined)

export const createRequet = createStore<
    | {
          name: string
          expiresAt: Date
          state: "requested"
      }
    | {
          state: "loading"
      }
    | {
          state: "done"
      }
    | {
          state: "error"
          error: Error
      }
    | undefined
>("apitokens/create", undefined)

const deleteRequest = createStore<
    | {
          name: string
          state: "requested"
      }
    | {
          state: "loading"
      }
    | {
          state: "done"
      }
    | {
          state: "error"
          error: Error
      }
    | undefined
>("apitokens/delete", undefined)

export const lastCreated = createStore<string | undefined>("apitokens/lastCreated", undefined)

export const actions = createActions({
    loadPage: () => {
        status.setState("page-requested")
    },

    previousPage: () => {
        if (pagination.state.pages.length === 0 || status.state === "loading") {
            return
        }

        let [prevPage, nextPages] = goBackOnePage(pagination.state.pages)

        batch(() => {
            pagination.setState((prev) => ({
                ...prev,
                pages: nextPages,
                currentPage: prevPage,
            }))
            status.setState("page-requested")
        })
    },

    nextPage: () => {
        if (!pagination.state.nextPage || status.state === "loading") {
            return
        }

        batch(() => {
            pagination.setState((prev) => ({
                ...prev,
                pages: [...prev.pages, prev.currentPage],
                currentPage: prev.nextPage,
                nextPage: undefined,
            }))

            status.setState("page-requested")
        })
    },

    createAPIToken: (token: { name: string; expiresAt: Date }) => {
        createRequet.setState({
            state: "requested",
            name: token.name,
            expiresAt: token.expiresAt,
        })
    },

    deleteAPIToken: (name: string) => {
        deleteRequest.setState({ state: "requested", name })
    },
})

export const selectors = {
    hasNextPage: (state: typeof pagination.state) => state.hasNextPage,
    hasPreviousPage: (state: typeof pagination.state) => state.hasNextPage,
}

const pageSize = 10

class NewerAPITokensLoadRequestError extends Error {
    public [CustomErrCode] = "NewerAPITokensLoadRequestError"
}

export function registerEffects(backend: BackendClient) {
    let loadAbortCntrl: AbortController | undefined

    createEffect("apitokens/loadPage", {
        fn: async (baseCtx: Context) => {
            if (status.state !== "page-requested") {
                return
            }

            status.setState("loading")

            loadAbortCntrl?.abort(new NewerAPITokensLoadRequestError())
            loadAbortCntrl = new AbortController()

            let ctx = baseCtx.withSignal(loadAbortCntrl.signal)
            let [tokens, err] = await backend.apiTokens.listAPITokens(ctx, {
                pagination: {
                    after: pagination.state.nextPage,
                    pageSize,
                },
            })

            err = err || ctx.err()

            if (err) {
                if (isErr(err, NewerAPITokensLoadRequestError)) {
                    return
                }

                batch(() => {
                    status.setState("error")
                    error.setState(err)
                })
                return
            }

            batch(() => {
                list.setState(tokens.items)
                pagination.setState((prev) => ({
                    ...prev,
                    nextPage: tokens.next,
                    hasNextPage: typeof tokens.next !== "undefined",
                }))
                status.setState("done")
                error.setState(undefined)
            })
        },
        autoMount: true,
        deps: [status],
        eager: false,
    })

    createEffect("apitokens/create", {
        fn: async (ctx: Context) => {
            let req = createRequet.state
            if (req?.state !== "requested") {
                return
            }

            createRequet.setState({ state: "loading" })
            status.setState("loading")

            let [created, err] = await backend.apiTokens.createAPIToken(ctx, req)

            if (err) {
                createRequet.setState({
                    state: "error",
                    error: err,
                })
                status.setState("done")
                return
            }

            batch(() => {
                createRequet.setState({ state: "done" })
                lastCreated.setState(created.token)
                status.setState("page-requested")
            })
        },
        autoMount: true,
        deps: [createRequet],
        eager: false,
    })

    createEffect("apitokens/delete", {
        fn: async (ctx: Context) => {
            let req = deleteRequest.state
            if (req?.state !== "requested") {
                return
            }

            deleteRequest.setState({ state: "loading" })
            status.setState("loading")

            let [, err] = await backend.apiTokens.deleteAPIToken(ctx, req.name)

            if (err) {
                deleteRequest.setState({
                    state: "error",
                    error: err,
                })
                status.setState("done")
                return
            }

            let apiTokens = list.state
            let pages = pagination.state.pages

            let isOnlyEntryInPage = apiTokens.length === 1
            let hasPrevPage = pages.length > 1

            if (isOnlyEntryInPage && hasPrevPage) {
                deleteRequest.setState({ state: "done" })
                actions.previousPage()
                return
            }

            batch(() => {
                deleteRequest.setState({ state: "done" })
                status.setState("page-requested")
            })
        },
        autoMount: true,
        deps: [deleteRequest],
        eager: false,
    })
}

if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
        if (!newModule) {
            return
        }

        newModule.list.setState(list.state)
        newModule.pagination.setState(pagination.state)
        newModule.status.setState(status.state)
        newModule.error.setState(error.state)
        newModule.lastCreated.setState(lastCreated.state)
    })
}
