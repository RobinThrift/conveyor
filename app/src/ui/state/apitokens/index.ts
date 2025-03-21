import type { RootState } from "@/ui/state/rootStore"

import * as apitokens from "./slice"

export type { CreateAPITokenRequest } from "./slice"

export const slice = apitokens.slice

export const selectors = {
    ...slice.getSelectors((state: RootState) => state.apitokens),
}

export const actions = {
    ...slice.actions,
}

export * from "./effects"
