import { PasswordChangeRequiredError, type PlaintextPassword } from "@/auth"
import type { BackendClient } from "@/backend/BackendClient"
import type { Context } from "@/lib/context"
import { isErr } from "@/lib/errors"
import { fromThrowing } from "@/lib/result"
import { batch, createActions, createEffect, createStore } from "@/lib/store"

export type AuthStatus =
    | "not-authenticated"
    | "authentication-requested"
    | "authenticating"
    | "authenticated"
    | "error"
    | "password-change-required"
    | "password-change-requested"
    | "password-change-in-progress"
    | "password-change-error"

export const status = createStore<AuthStatus>("auth/status", "not-authenticated")

export const error = createStore<Error | undefined>("auth/error", undefined)

const authRequest = createStore<
    | {
          username: string
          password: PlaintextPassword
          server: string
      }
    | undefined
>("auth/authRequest", undefined)

const changePasswordRequest = createStore<
    | {
          username: string
          currentPassword: PlaintextPassword
          newPassword: PlaintextPassword
          newPasswordRepeat: PlaintextPassword
      }
    | undefined
>("auth/changePasswordRequest", undefined)

const resetRequest = createStore("auth/resetRequest", false)

export const actions = createActions({
    authenticate: (params: { username: string; password: PlaintextPassword; server: string }) => {
        batch(() => {
            error.setState(undefined)
            status.setState("authentication-requested")
            authRequest.setState(params)
        })
    },

    changePassword: (params: {
        username: string
        currentPassword: PlaintextPassword
        newPassword: PlaintextPassword
        newPasswordRepeat: PlaintextPassword
    }) => {
        batch(() => {
            error.setState(undefined)
            authRequest.setState(undefined)
            changePasswordRequest.setState(params)
            status.setState("password-change-requested")
        })
    },

    setAuthStatus: (newStatus: AuthStatus) => {
        batch(() => {
            status.setState(newStatus)
            error.setState(undefined)
            authRequest.setState(undefined)
            changePasswordRequest.setState(undefined)
        })
    },

    reset: () => {
        resetRequest.setState(true)
    },
})

const _actions = createActions({
    startAuthentication: () => status.setState("authenticating"),
    startPasswordChange: () => status.setState("password-change-in-progress"),
    passwordChangeRequired: (initialErr: Error) => {
        status.setState("password-change-required")
        error.setState(initialErr)
    },
    authenticated: () => {
        status.setState("authenticated")
        error.setState(undefined)
        authRequest.setState(undefined)
    },
    setError: (err: Error, state: "error" | "password-change-error" = "error") => {
        status.setState(state)
        error.setState(err)
    },
    reset: () => {
        status.setState("not-authenticated")
        error.setState(undefined)
        authRequest.setState(undefined)
        changePasswordRequest.setState(undefined)
    },
})

export function registerEffects(backend: BackendClient) {
    createEffect("auth/authenticate", {
        fn: async (ctx: Context, { batch }) => {
            let currReq = authRequest.state
            if (!currReq) {
                return
            }

            batch(() => _actions.startAuthentication())

            let [serverURL, err] = fromThrowing(() => new URL(currReq.server))
            if (err) {
                batch(() => _actions.setError(err))
                return
            }

            await backend.auth.setOrigin(ctx, serverURL.host)
            let [, getInitialTokenErr] = await backend.auth.getInitialToken(ctx, currReq)

            if (isErr(getInitialTokenErr, PasswordChangeRequiredError)) {
                batch(() => _actions.passwordChangeRequired(getInitialTokenErr))
                return
            }

            if (getInitialTokenErr) {
                batch(() => _actions.setError(getInitialTokenErr))
                return
            }

            batch(() => _actions.authenticated())
        },
        autoMount: true,
        deps: [status, authRequest],
        precondition: () =>
            status.state === "authentication-requested" && typeof authRequest.state !== "undefined",
        eager: false,
    })

    createEffect("auth/changePassword", {
        fn: async (ctx: Context, { batch }) => {
            let currReq = changePasswordRequest.state
            if (status.state !== "password-change-requested" || !currReq) {
                return
            }

            batch(() => _actions.startPasswordChange())

            let [_, err] = await backend.auth.changePassword(ctx, currReq)

            if (err) {
                batch(() => _actions.setError(err, "password-change-error"))
                return
            }

            batch(() => _actions.reset())
        },
        autoMount: true,
        deps: [status, changePasswordRequest],
        precondition: () =>
            status.state === "password-change-requested" &&
            typeof changePasswordRequest.state !== "undefined",
        eager: false,
    })

    createEffect("auth/reset", {
        fn: async (ctx: Context) => {
            batch(() => {
                resetRequest.setState(false)
                status.setState("not-authenticated")
                error.setState(undefined)
                authRequest.setState(undefined)
                changePasswordRequest.setState(undefined)
            })

            let [_, err] = await backend.auth.reset(ctx)

            err = err || ctx.err()

            if (err) {
                batch(() => {
                    status.setState("error")
                    error.setState(err)
                })
            }
        },
        autoMount: true,
        deps: [resetRequest],
        precondition: () => resetRequest.state,
        eager: false,
    })
}

if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
        if (!newModule) {
            return
        }

        newModule.status.setState(status.state)
    })
}
