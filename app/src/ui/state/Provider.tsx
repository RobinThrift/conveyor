import React from "react"
import { Provider as ReduxProvider } from "react-redux"

import type { configureRootStore } from "./rootStore"

export function Provider({
    store,
    children,
}: React.PropsWithChildren<{ store: ReturnType<typeof configureRootStore> }>) {
    return <ReduxProvider store={store}>{children}</ReduxProvider>
}
