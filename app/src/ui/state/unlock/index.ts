import { slice as settings } from "./slice"

export const slice = settings

export const actions = slice.actions

export const selectors = slice.selectors

export * from "./effects"
