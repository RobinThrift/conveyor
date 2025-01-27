import { lazy } from "react"

export type { MemoEditPageProps } from "./MemoEditPage"

export const MemoEditPage = lazy(() =>
    import("./MemoEditPage").then(({ MemoEditPage }) => ({
        default: MemoEditPage,
    })),
)
