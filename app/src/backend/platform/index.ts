import type { InitPlatform } from "./types"

declare const __PLATFORM__: "TAURI" | "WEB"

export async function init() {
    let platformInit: InitPlatform
    if (__PLATFORM__ === "TAURI") {
        platformInit = (await import("./platform.tauri")).init
    } else {
        platformInit = (await import("./platform.web")).init
    }

    return platformInit({
        db: {
            onError: (err) => {
                console.error(err)
            },
        },
        fs: {
            baseDir: "",
            onError: (err) => {
                console.error(err)
            },
        },
    })
}
