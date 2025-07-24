import type { BackendClient } from "@/backend/BackendClient"
import {
    NavigationController,
    type Params,
    type Restore,
    type Screens,
    type Stacks,
} from "@/control/NavigationController"
import type { Attachment } from "@/domain/Attachment"
import { HistoryNavigationBackend } from "@/external/browser/HistoryNavigationBackend"
import type { AsyncResult } from "@/lib/result"
import * as stores from "@/ui/stores"

import { MockBackendClient } from "./MockBackendClient"

export type InitOpts = {
    generateMockData?: boolean
    mockAttachments?: Record<
        string,
        () => AsyncResult<{ attachment: Attachment; data: ArrayBufferLike }>
    >
}

export async function init({ generateMockData, mockAttachments }: InitOpts) {
    let backend = new MockBackendClient({ mockAttachments })

    await backend.init()

    if (generateMockData) {
        await backend.generateMockData()
    }

    let navCtrl = new NavigationController({
        backend: new HistoryNavigationBackend<Screens, Stacks, Params, Restore>({
            fromURLParams: NavigationController.fromURLParams,
            toURLParams: NavigationController.toURLParams,
            screenToURLMapping: NavigationController.screenToURLMapping,
            urlToScreenMapping: NavigationController.urlToScreenMapping,
        }),
    })

    stores.registerEffects({ backend: backend as unknown as BackendClient, navCtrl })

    backend.emitEvent("init/autoUnlock", { isSetup: false })
}
