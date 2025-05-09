import type { NavigationController } from "@/control/NavigationController"
import { actions, type RootStore } from "@/ui/state"

export function initNavgation({
    rootStore,
    navCtrl,
}: {
    rootStore: RootStore
    navCtrl: NavigationController
}) {
    let init = navCtrl.init()

    rootStore.dispatch(
        actions.navigation.setPage({
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
}
