interface _Env {
    platform: "web" | "pwa" | "macos" | "tauri-generic"
    lang: readonly string[]
    isDeviceSecureStorageAvailable: boolean
}

type SetEnvMessag = { type: "env:set"; data: Partial<_Env> }

export const Env: _Env = {
    platform: "web",
    lang: [],
    isDeviceSecureStorageAvailable: false,
}

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
