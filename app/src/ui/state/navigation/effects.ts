import type { NavigationController } from "@/control/NavigationController"
import type { StartListening } from "@/ui/state/rootStore"

import { slice as memoList } from "../memos/list"
import { slice } from "./slice"

export const registerEffects = (
    startListening: StartListening,
    { navCtrl }: { navCtrl: NavigationController },
) => {
    startListening({
        actionCreator: memoList.actions.setFilter,
        effect: async ({ payload }, { cancelActiveListeners, getState }) => {
            cancelActiveListeners()
            if (payload.source === "navigation") {
                return
            }

            let state = getState()
            let currScreen = slice.selectors.currentName(state)
            if (
                currScreen === "root" ||
                currScreen === "memo.view" ||
                currScreen === "memo.edit"
            ) {
                navCtrl.updateParams({
                    filter: payload.filter,
                })
            }
        },
    })
}
