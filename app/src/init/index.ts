import {
    NavigationController,
    type Params,
    type Restore,
    type Screens,
    type Stacks,
} from "@/control/NavigationController"
import { HistoryNavigationBackend } from "@/external/browser/HistoryNavigationBackend"
import type { RemoteNavigationPushMessage } from "@/lib/navigation"

import { initBackend } from "./backend"
import { initNavigation } from "./navigation"

export async function init() {
    let { rootStore, onNavigationEvent, attachmentLoader } = await initBackend()

    let navCtrl = initNavigation({
        rootStore,
        navigationBackend: new HistoryNavigationBackend<Screens, Stacks, Params, Restore>({
            fromURLParams: NavigationController.fromURLParams,
            toURLParams: NavigationController.toURLParams,
            screenToURLMapping: NavigationController.screenToURLMapping,
        }),
    })

    onNavigationEvent(
        (evt: MessageEvent<RemoteNavigationPushMessage<Screens, Stacks, Restore>>) => {
            let msg = evt.data
            if (msg?.type === "navigation:push") {
                evt.stopImmediatePropagation()
                navCtrl.push(evt.data.next)
            }
        },
    )

    return {
        rootStore,
        attachmentLoader,
        navCtrl,
    }
}
