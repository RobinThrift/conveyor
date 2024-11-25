import { lazy } from "react"

export type { SingleMemoPageProps } from "./SingleMemoPage"

export const SingleMemoPage = lazy(() =>
    import("./SingleMemoPage").then(({ SingleMemoPage }) => ({
        default: SingleMemoPage,
    })),
)
