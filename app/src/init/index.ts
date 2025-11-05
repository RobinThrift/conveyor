import { BackendClient } from "@/backend/BackendClient"
import type { Params, Screens } from "@/control/NavigationController"
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
        navigationBackend: new HistoryNavigationBackend<Screens, Params>({
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

                        let memoID = u.searchParams.get("memo")
                        if (memoID) {
                            params.ids = [memoID]
                        }

                        return params
                    },
                ],
            ]),
        }),
    })

    stores.registerEffects({ backend, navCtrl })

    initUI({
        rootElement,
        serverError,
        navCtrl,
    })
}
