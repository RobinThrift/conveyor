import type { AsyncResult } from "@/lib/result"

export interface Updater {
    hasUpdate: boolean

    update(): AsyncResult<void>

    addEventListener(event: "updateAvailable", handler: () => void): () => void
}
