interface _Env {
    platform: "web" | "pwa" | "macos" | "tauri-generic"
    lang: readonly string[]
    isDeviceSecureStorageAvailable: boolean
}

const _channel = new BroadcastChannel("env")

type SetEnvMessag = { type: "env:set"; data: Partial<_Env> }

_channel.addEventListener("message", (evt: MessageEvent<SetEnvMessag>) => {
    let msg = evt.data
    if (msg?.type !== "env:set") {
        return
    }

    evt.stopImmediatePropagation()

    setEnv(msg.data)
})

export const Env: _Env = {
    platform: "web",
    lang: [],
    isDeviceSecureStorageAvailable: false,
}

export function setEnv(env: Partial<_Env>) {
    for (let key in env) {
        let k = key as keyof _Env
        if (typeof env[k] !== "undefined") {
            ;(Env[k] as _Env[typeof k]) = env[k]
        }
    }

    _channel.postMessage({
        type: "env:set",
        data: env,
    } satisfies SetEnvMessag)
}
