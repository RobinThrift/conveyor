import { lazy } from "react"

export const APIDocsPage = lazy(() =>
    import("./APIDocsPage").then(({ APIDocsPage }) => ({
        default: APIDocsPage,
    })),
)
