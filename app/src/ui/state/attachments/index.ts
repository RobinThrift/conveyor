import { combineSlices } from "@reduxjs/toolkit"

import type { RootState } from "@/ui/state/rootStore"

import * as transfer from "./transfer"

export const slice = {
    reducerPath: "attachments",
    reducer: combineSlices(transfer.slice),
}

export const selectors = {
    ...transfer.slice.getSelectors(
        (state: RootState) => state.attachments.transfer,
    ),
}

export const actions = {
    ...transfer.slice.actions,
}

export * from "./effects"
