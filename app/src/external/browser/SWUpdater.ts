import { queueTask } from "@/lib/microtask"
import { type AsyncResult, Ok, wrapErr } from "@/lib/result"
import type { Updater } from "@/lib/Updater"

export class SWUpdater implements Updater {
    private _hasUpdate = false
    private _events = {
        updateAvailable: [] as (() => void)[],
    }

    private _updateFn?: (reloadPage?: boolean | undefined) => Promise<void>

    public setUpdateFn(fn: (reloadPage?: boolean | undefined) => Promise<void>) {
        this._updateFn = fn
    }

    async update(): AsyncResult<void> {
        try {
            let keys = await globalThis.caches.keys()
            for (let k of keys) {
                await globalThis.caches.delete(k)
            }

            await this._updateFn?.()
        } catch (e) {
            return wrapErr`error updating service worker: ${e as Error}`
        }

        return Ok()
    }

    set hasUpdate(u: boolean) {
        this._hasUpdate = u
        if (u) {
            this._triggerEvent("updateAvailable")
        }
    }

    get hasUpdate(): boolean {
        return this._hasUpdate
    }

    addEventListener(event: "updateAvailable", handler: () => void): () => void {
        this._events[event].push(handler)
        return () => {
            this._events[event] = this._events[event].filter((i) => handler !== i)
        }
    }

    private _triggerEvent(event: "updateAvailable"): void {
        this._events[event].forEach((handler) => {
            queueTask(() => handler())
        })
    }
}
