import { lazy } from "react"

export type { ListMemosPageProps } from "./ListMemosPage"

export const ListMemosPage = lazy(() =>
    import("./ListMemosPage").then(({ ListMemosPage }) => ({
        default: ListMemosPage,
    })),
)
