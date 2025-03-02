import { lazy } from "react"

export type { UnlockScreenProps } from "./UnlockScreen"

export const UnlockScreen = lazy(() =>
    import("./UnlockScreen").then(({ UnlockScreen }) => ({
        default: UnlockScreen,
    })),
)
