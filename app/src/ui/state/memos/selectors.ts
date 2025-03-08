import type { RootState } from "@/ui/state/rootStore"

import * as create from "./create"
import * as list from "./list"
import * as single from "./single"
import * as update from "./update"

export const selectors = {
    ...list.slice.getSelectors((state: RootState) => state.memos.list),
    ...create.slice.getSelectors((state: RootState) => state.memos.create),
    ...update.slice.getSelectors((state: RootState) => state.memos.update),
    ...single.slice.getSelectors((state: RootState) => state.memos.single),
}
