interface _Env {
    platform: "web" | "pwa" | "macos" | "tauri-generic"
    lang: readonly string[]
    isDeviceSecureStorageAvailable: boolean
}

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
}
