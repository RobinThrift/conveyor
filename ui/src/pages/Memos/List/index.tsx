import { lazy } from "react"

export type { MemosListPageProps } from "./MemosListPage"

export const MemosListPage = lazy(() =>
    import("./MemosListPage").then(({ MemosListPage }) => ({
        default: MemosListPage,
    })),
)
