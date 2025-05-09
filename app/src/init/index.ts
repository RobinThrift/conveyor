import { BaseContext } from "@/lib/context"

import { tryAutoUnlock } from "./autounlock"
import { initController } from "./controller"
import { initJobs } from "./jobs"
import { initNavgation } from "./navigation"
import type { InitPlatform } from "./platform"
import { initRootStore } from "./store"

declare const __PLATFORM__: "TAURI" | "WEB"

export async function init() {
    let platform = await initPlatform()

    let controller = await initController(platform)
    let rootStore = initRootStore(controller)

    initNavgation({ rootStore, navCtrl: controller.navCtrl })

    await tryAutoUnlock(BaseContext, {
        rootStore,
        unlockCtrl: controller.unlockCtrl,
        navCtrl: controller.navCtrl,
    })

    initJobs({ jobCtrl: controller.jobCtrl, rootStore: rootStore })

    return {
        rootStore,
        attachmentCtrl: controller.attachmentCtrl,
        navCtrl: controller.navCtrl,
    }
}

async function initPlatform() {
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
