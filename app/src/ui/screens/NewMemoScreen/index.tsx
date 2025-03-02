import { lazy } from "react"

export const NewMemoScreen = lazy(() =>
    import("./NewMemoScreen").then(({ NewMemoScreen }) => ({
        default: NewMemoScreen,
    })),
)
