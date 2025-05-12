import {
    NavigationController,
    type Restore,
    type Screens,
} from "@/control/NavigationController"
import type { NavigationBackend } from "@/lib/navigation"
import { type RootStore, actions } from "@/ui/state"

export function initNavgation({
    rootStore,
    navigationBackend,
}: {
    rootStore: RootStore
    navigationBackend: NavigationBackend<Screens, Restore>
}) {
    let navCtrl = new NavigationController({
        backend: navigationBackend,
    })

    let init = navCtrl.init()

    rootStore.dispatch(
        actions.navigation.init({
            name: init.screen.name,
            params: init.screen.params,
            restore: init.restore,
        }),
    )

    navCtrl.addEventListener("pop", (current) => {
        rootStore.dispatch(
            actions.navigation.setPage({
                name: current.screen.name,
                params: current.screen.params,
                restore: current.restore,
            }),
        )

        document.documentElement.style.setProperty(
            "min-height",
            current.restore.scrollOffsetTop
                ? `${Math.ceil(current.restore.scrollOffsetTop)}px`
                : "initial",
        )
        requestAnimationFrame(() => {
            window.scrollTo(0, Math.ceil(current.restore.scrollOffsetTop ?? 0))
        })
    })

    navCtrl.addEventListener("push", (current) => {
        rootStore.dispatch(
            actions.navigation.setPage({
                name: current.screen.name,
                params: current.screen.params,
                restore: current.restore,
            }),
        )

        document.documentElement.style.setProperty(
            "min-height",
            current.restore.scrollOffsetTop
                ? `${Math.ceil(current.restore.scrollOffsetTop)}px`
                : "initial",
        )
        requestAnimationFrame(() => {
            window.scrollTo(0, Math.ceil(current.restore.scrollOffsetTop ?? 0))
        })
    })

    return navCtrl
}
