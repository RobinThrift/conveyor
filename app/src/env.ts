/**
 * Due to bugs in how Safari handles ES-Modules, and agains the spec, each module is reevaluted on every import even from with the same context.
 * This means that the `const Env` expression gets overwritten even after it was changed and mutliple BroadcastChannels would be created.
 * To prevent this the values are saved to the global scope, as they are designed to be globals.
 * I'm sure I will discover even more of this type of bug soon...
 */

interface _Env {
    platform: "web" | "pwa" | "macos" | "tauri-generic"
    lang: readonly string[]
    isDeviceSecureStorageAvailable: boolean
}

type SetEnvMessag = { type: "env:set"; data: Partial<_Env> }

export const Env: _Env = globalThis.__CONVEYOR_ENV__ ?? {
    platform: "web",
    lang: [],
    isDeviceSecureStorageAvailable: false,
}
globalThis.__CONVEYOR_ENV__ = Env

export function setEnv(env: Partial<_Env>, fromRemote = false) {
    for (let key in env) {
        let k = key as keyof _Env
        if (typeof env[k] !== "undefined") {
            ;(Env[k] as _Env[typeof k]) = env[k]
        }
    }

    if (!fromRemote) {
        globalThis.__CONVEYOR_ENV_CHANNEL__?.postMessage({
            type: "env:set",
            data: env,
        } satisfies SetEnvMessag)
    }
}

declare global {
    var __CONVEYOR_ENV_CHANNEL__: BroadcastChannel
    var __CONVEYOR_ENV__: _Env
}

if (!("__CONVEYOR_ENV_CHANNEL__" in globalThis)) {
    globalThis.__CONVEYOR_ENV_CHANNEL__ = new BroadcastChannel("env")

    globalThis.__CONVEYOR_ENV_CHANNEL__.addEventListener(
        "message",
        (evt: MessageEvent<SetEnvMessag>) => {
            let msg = evt.data
            if (msg?.type !== "env:set") {
                return
            }

            evt.stopImmediatePropagation()

            setEnv(msg.data, true)
        },
    )
}
