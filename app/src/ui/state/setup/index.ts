import { slice as setup } from "./slice"

export const slice = setup

export const actions = slice.actions

export const selectors = slice.selectors

export * from "./effects"
