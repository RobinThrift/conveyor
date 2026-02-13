import { registerSW } from "virtual:pwa-register"

import { SWUpdater } from "@/external/browser/SWUpdater"
import { type AsyncResult, Ok } from "@/lib/result"
import type { Updater } from "@/lib/Updater"

declare const __PLATFORM__: "TAURI" | "WEB"

export const setupServiceWorker: () => Promise<Updater> =
    __PLATFORM__ === "WEB" ? _setupServiceWorker : () => Promise.resolve(new MockUpdater())

async function _setupServiceWorker() {
    let updater = new SWUpdater()

    let update = registerSW({
        onNeedRefresh: () => {
            updater.hasUpdate = true
        },

        onRegisterError: (err) => {
            console.error(`error registering service worker`, err)
        },
    })

    updater.setUpdateFn(update)

    return updater
}

class MockUpdater implements Updater {
    public hasUpdate = false

    async update(): AsyncResult<void> {
        return Ok()
    }

    addEventListener(_event: "updateAvailable", _handler: () => void): () => void {
        return () => {}
    }
}
