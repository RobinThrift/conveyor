import { lazy } from "react"

export type { ErrorScreenProps } from "./ErrorScreen"

export const ErrorScreen = lazy(() =>
    import("./ErrorScreen").then(({ ErrorScreen }) => ({
        default: ErrorScreen,
    })),
)
