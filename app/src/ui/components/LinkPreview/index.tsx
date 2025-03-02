import { lazy } from "react"

export type { LinkPreviewProps } from "./LinkPreview"

export const LinkPreview = lazy(() =>
    import("./LinkPreview").then(({ LinkPreview }) => ({
        default: LinkPreview,
    })),
)
