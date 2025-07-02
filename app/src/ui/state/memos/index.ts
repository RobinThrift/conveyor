import { combineSlices } from "@reduxjs/toolkit"

import * as create from "./create"
import * as list from "./list"
import * as single from "./single"
import * as update from "./update"

export type { Filter } from "./list"
export type { CreateMemoRequest } from "./create"
export type { UpdateMemoRequest } from "./update"

export const slice = {
    reducerPath: "memos",
    reducer: combineSlices(list.slice, create.slice, update.slice, single.slice),
}

export * from "./selectors"

export const actions = {
    ...list.slice.actions,
    ...create.slice.actions,
    ...update.slice.actions,
    ...single.slice.actions,
}

export * from "./effects"
