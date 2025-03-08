import type { RootState } from "@/ui/state/rootStore"

import * as tags from "./slice"

export const slice = tags.slice

export const selectors = {
    ...slice.getSelectors((state: RootState) => state.tags),
}

export const actions = {
    ...slice.actions,
}

export * from "./effects"
