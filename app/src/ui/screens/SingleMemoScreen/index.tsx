import { lazy } from "react"

export type { SingleMemoScreenProps } from "./SingleMemoScreen"

export const SingleMemoScreen = lazy(() =>
    import("./SingleMemoScreen").then(({ SingleMemoScreen }) => ({
        default: SingleMemoScreen,
    })),
)
