import { lazy } from "react"

export type { ImageProps } from "./Image"

export const Image = lazy(() =>
    import("./Image").then(({ Image }) => ({ default: Image })),
)
