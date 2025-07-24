import { lazy } from "react"

export type { FigureProps as ImageProps } from "./Figure"

export * from "./Figure"

export const Figure = lazy(() => import("./Figure").then(({ Figure }) => ({ default: Figure })))
