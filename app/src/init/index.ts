import { BackendClient } from "@/backend/BackendClient"
import {
    NavigationController,
    type Params,
    type Restore,
    type Screens,
} from "@/control/NavigationController"
import { HistoryNavigationBackend } from "@/external/browser/HistoryNavigationBackend"
import * as stores from "@/ui/stores"

import { initNavigation } from "./navigation"
import { initUI } from "./ui"

export async function init({
    rootElement,
    serverError,
}: {
    rootElement: HTMLElement
    serverError?: any
}) {
    let backend = new BackendClient()

    let navCtrl = initNavigation({
        navigationBackend: new HistoryNavigationBackend<Screens, Params, Restore>({
            toURLParams: NavigationController.toURLParams,
            screenToURLMapping: NavigationController.screenToURLMapping,
            urlToScreenMapping: NavigationController.urlToScreenMapping,
            screenToStackMapping: NavigationController.screenToStackMapping,
        }),
    })

    stores.registerEffects({ backend, navCtrl })

    initUI({
        rootElement,
        serverError,
        navCtrl,
    })
}
