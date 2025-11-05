import type { NavigationController, Params, Screens, Stacks } from "@/control/NavigationController"
import type { NavgationState } from "@/lib/navigation"
import { batch, createActions, createStore } from "@/lib/store"

export const currentScreen = createStore<NavgationState<Screens>>("navigation/currentScreen", {
    screen: "list",
    stack: "main",
    params: {},
})

export const actions = createActions({
    init: (screen: { screen: keyof Screens; params: Params[keyof Screens]; stack: Stacks }) => {
        batch(() => {
            currentScreen.setState(screen)
        })
    },
    setScreen: (screen: {
        screen: keyof Screens
        params: Params[keyof Screens]
        stack: Stacks
    }) => {
        batch(() => {
            currentScreen.setState(screen)
        })
    },
})

export function registerEffects(navCtrl: NavigationController) {
    navCtrl.addEventListener("pop", (screen) => {
        actions.setScreen(screen)
    })

    navCtrl.addEventListener("push", (screen) => {
        actions.setScreen(screen)
    })
}

if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
        if (!newModule) {
            return
        }

        newModule.currentScreen.setState(currentScreen.state)
    })
}
