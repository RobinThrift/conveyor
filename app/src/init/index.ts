import { BackendClient } from "@/backend/BackendClient"
import {
    NavigationController,
    type Params,
    type Restore,
    type Screens,
    type Stacks,
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
        navigationBackend: new HistoryNavigationBackend<Screens, Stacks, Params, Restore>({
            fromURLParams: NavigationController.fromURLParams,
            toURLParams: NavigationController.toURLParams,
            screenToURLMapping: NavigationController.screenToURLMapping,
            urlToScreenMapping: NavigationController.urlToScreenMapping,
        }),
    })

    stores.registerEffects({ backend, navCtrl })

    initUI({
        rootElement,
        serverError,
        navCtrl,
    })
}
