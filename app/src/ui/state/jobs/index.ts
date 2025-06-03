import type { RootState } from "@/ui/state/rootStore"

import * as tags from "./slice"

export const slice = tags.slice

export const selectors = {
    ...slice.getSelectors((state: RootState) => state.jobs),
}

export const actions = {
    ...slice.actions,
}

export * from "./effects"
