import { lazy, memo } from "react"

export const UnlockScreen = lazy(() =>
    import("./UnlockScreen").then(({ UnlockScreen }) => ({
        default: memo(UnlockScreen),
    })),
)
