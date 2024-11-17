import { lazy } from "react"

export type { ErrorPageProps } from "./ErrorPage"

export const ErrorPage = lazy(() =>
    import("./ErrorPage").then(({ ErrorPage }) => ({ default: ErrorPage })),
)
