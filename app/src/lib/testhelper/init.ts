import type { BackendClient } from "@/backend/BackendClient"
import { NavigationController, type Params, type Screens } from "@/control/NavigationController"
import type { Attachment } from "@/domain/Attachment"
import { HistoryNavigationBackend } from "@/external/browser/HistoryNavigationBackend"
import { type AsyncResult, Ok } from "@/lib/result"
import type { Updater } from "@/lib/Updater"
import * as stores from "@/ui/stores"

import { MockBackendClient } from "./MockBackendClient"

export type InitOpts = {
    generateMockData?: boolean
    mockAttachments?: Record<
        string,
        () => AsyncResult<{ attachment: Attachment; data: ArrayBuffer }>
    >
}

export async function init({ generateMockData, mockAttachments }: InitOpts) {
    let backend = new MockBackendClient({ mockAttachments })

    await backend.init()

    if (generateMockData) {
        await backend.generateMockData()
    }

    let navCtrl = new NavigationController({
        backend: new HistoryNavigationBackend<Screens, Params>({
            routes: HistoryNavigationBackend.screensToRoutes([
                ["list", "main", "/"],
                ["unlock", "main"],
                ["setup", "main"],
                ["settings", "settings"],
                [
                    "memos",
                    "memos",
                    undefined,
                    (u: URL) => {
                        let params: Params["memos"] = { ids: [] }
                        let editPosition = u.searchParams.get("editPosition")
                        if (editPosition) {
                            params.editPosition = JSON.parse(decodeURIComponent(editPosition))
                        }

                        let ids = u.searchParams.get("memo")
                        if (ids) {
                            params.ids = ids.split(",")
                        }

                        return params
                    },
                ],
            ]),
        }),
    })

    stores.registerEffects({
        backend: backend as unknown as BackendClient,
        navCtrl,
        updater: new MockUpdater(),
    })

    backend.emitEvent("init/autoUnlock", { isSetup: false })
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
