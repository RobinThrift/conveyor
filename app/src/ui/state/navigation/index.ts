import { slice as navigation } from "./slice"

export const slice = navigation

export const actions = slice.actions

export const selectors = slice.selectors

export { registerEffects } from "./effects"
