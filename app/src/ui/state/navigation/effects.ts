import type { NavigationController } from "@/control/NavigationController"
import type { StartListening } from "@/ui/state/rootStore"

import { slice as memoList } from "../memos/list"
import { slice } from "./slice"

export const registerEffects = (
    startListening: StartListening,
    { navCtrl }: { navCtrl: NavigationController },
) => {
    startListening({
        predicate: (action, currentState, originalState) => {
            if (
                action.type !== memoList.actions.setFilter.type &&
                action.type !== memoList.actions.setTagFilter.type
            ) {
                return false
            }
            return currentState.memos.list.filter !== originalState.memos.list.filter
        },
        effect: async (_, { cancelActiveListeners, getState }) => {
            cancelActiveListeners()
            let state = getState()
            let currScreen = slice.selectors.currentName(state)
            if (currScreen === "root" || currScreen === "memo.view" || currScreen === "memo.edit") {
                navCtrl.updateParams({
                    filter: state.memos.list.filter,
                })
            }
        },
    })
}
