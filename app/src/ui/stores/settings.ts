import type { BackendClient } from "@/backend/BackendClient"
import { DEFAULT_SETTINGS, type Settings } from "@/domain/Settings"
import { Second } from "@/lib/duration"
import { getPath, type KeyPaths, setPath, type ValueAt } from "@/lib/getset"
import { batch, createActions, createEffect, createStore } from "@/lib/store"

import * as unlock from "./unlock"

export const state = createStore<
    | {
          state: "load-requested"
      }
    | {
          state: "loading"
      }
    | { state: "done" }
    | { state: "error"; error: Error }
>("settings/state", { state: "load-requested" })

export const values = createStore<Settings>("settings/values", DEFAULT_SETTINGS)

export const updateRequest = createStore<{ key: KeyPaths<Settings>; value: any } | undefined>(
    "settings/updateRequest",
    undefined,
)

export const actions = createActions({
    set: <K extends KeyPaths<Settings>>(key: K, value: ValueAt<Settings, K>) => {
        batch(() => {
            values.setState((prev) => setPath(prev, key, value))
            updateRequest.setState({ key, value })
        })
    },
    load: () => {
        state.setState({ state: "load-requested" })
    },
})

export const selectors = {
    value:
        <K extends KeyPaths<Settings>>(key: K) =>
        (v: typeof values.state): ValueAt<Settings, K> =>
            getPath(v, key),
    mode: (v: typeof values.state) => v.ui.colourScheme.mode,
    colourScheme: (v: typeof values.state) => v.ui.colourScheme,
}

export function registerEffects(backend: BackendClient) {
    createEffect("settings/load", {
        fn: async (baseCtx) => {
            state.setState({ state: "loading" })

            let [ctx, cancel] = baseCtx.withTimeout(Second * 5)
            let [loaded, err] = await backend.settings.loadSettings(ctx)

            cancel()
            if (err) {
                state.setState({ state: "error", error: err })
                return
            }

            batch(() => {
                state.setState({ state: "done" })
                values.setState(loaded)
            })
        },
        deps: [state, unlock.status],
        precondition: () =>
            unlock.status.state === "unlocked" && state.state.state === "load-requested",
        eager: false,
        autoMount: true,
    })

    createEffect("settings/update", {
        fn: async (ctx) => {
            if (!updateRequest.state) {
                return
            }

            let [, err] = await backend.settings.updateSetting(ctx, {
                key: updateRequest.state.key,
                value: updateRequest.state.value,
            })
            if (err) {
                console.error(err)
                return
            }
            updateRequest.setState(undefined)
        },
        deps: [updateRequest],
        eager: false,
        autoMount: true,
    })

    backend.addEventListener("settings/onSettingChanged", (setting) => {
        values.setState((prev) => setPath(prev, setting.key, setting.value))
    })
}

if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
        if (!newModule) {
            return
        }

        newModule.state.setState(state.state)
        newModule.values.setState(values.state)
    })
}
