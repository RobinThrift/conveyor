import { lazy } from "react"

export type { MemoSinglePageProps } from "./MemoSinglePage"

export const MemoSinglePage = lazy(() =>
    import("./MemoSinglePage").then(({ MemoSinglePage }) => ({
        default: MemoSinglePage,
    })),
)
