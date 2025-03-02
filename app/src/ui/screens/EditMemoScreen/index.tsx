import { lazy } from "react"

export type { EditMemoScreenProps } from "./EditMemoScreen"

export const EditMemoScreen = lazy(() =>
    import("./EditMemoScreen").then(({ EditMemoScreen }) => ({
        default: EditMemoScreen,
    })),
)
