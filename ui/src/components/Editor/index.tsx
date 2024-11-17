import { lazy } from "react"

export type { EditorProps } from "./Editor"

export const Editor = lazy(() =>
    import("./Editor").then(({ Editor }) => ({ default: Editor })),
)
