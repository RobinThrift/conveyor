import { lazy } from "react"

export const MemoNewPage = lazy(() =>
    import("./MemoNewPage").then(({ MemoNewPage }) => ({
        default: MemoNewPage,
    })),
)
