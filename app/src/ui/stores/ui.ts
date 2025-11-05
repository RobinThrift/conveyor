import type { NavigationController } from "@/control/NavigationController"
import type { MemoID } from "@/domain/Memo"
import { batch, createActions, createEffect, createStore } from "@/lib/store"

import * as memoList from "./memoList"
import * as memos from "./memos"

export const openMemos = createStore<MemoID[]>("ui/openMemos", [])

export const activeMemos = createStore<MemoID[]>("ui/activeMemos", [])

export const memoTabScrollOffsets = createStore<Record<MemoID, { scrollOffsetTop: number }>>(
    "ui/memoTabScrollOffsets",
    {},
)

export const memoListTabID = "memo-list"

export const actions = createActions({
    deactivateAllMemos: (scrollOffsetTop?: number) => {
        batch(() => {
            let currentActiveMemo = activeMemos.state[0]
            activeMemos.setState([])

            if (typeof scrollOffsetTop !== "undefined" && currentActiveMemo) {
                memoTabScrollOffsets.setState((p) => ({
                    ...p,
                    [currentActiveMemo]: { scrollOffsetTop },
                }))
            }
        })
    },

    openMemo: (memoID: MemoID, scrollOffsetTop?: number) => {
        batch(() => {
            let currentActiveMemo = activeMemos.state[0] ?? memoListTabID

            activeMemos.setState([memoID])

            if (openMemos.state.includes(memoID)) {
                return
            }

            if (typeof scrollOffsetTop !== "undefined") {
                memoTabScrollOffsets.setState((p) => ({
                    ...p,
                    [currentActiveMemo]: { scrollOffsetTop },
                }))
            }

            memos.actions.incMemoRef(memoID)
            openMemos.setState([...openMemos.state, memoID])
        })
    },

    activateMemo: (memoID: MemoID, scrollOffsetTop?: number) => {
        batch(() => {
            if (!openMemos.state.includes(memoID)) {
                return
            }

            if (activeMemos.state.includes(memoID)) {
                return
            }

            let currentActiveMemo = activeMemos.state[0] ?? memoListTabID
            if (typeof scrollOffsetTop !== "undefined") {
                memoTabScrollOffsets.setState((p) => ({
                    ...p,
                    [currentActiveMemo]: { scrollOffsetTop },
                }))
            }

            activeMemos.setState([memoID])
        })
    },

    closeMemo: (memoID: MemoID) => {
        batch(() => {
            let index = openMemos.state.indexOf(memoID)
            if (index === -1) {
                return
            }

            let nextOpenMemos = openMemos.state.toSpliced(index, 1)

            openMemos.setState(nextOpenMemos)
            memos.actions.decMemoRef(memoID)

            if (!activeMemos.state.includes(memoID)) {
                return
            }

            let nextActiveTab = nextOpenMemos.at(index - 1)
            if (nextActiveTab) {
                activeMemos.setState([nextActiveTab])
            } else {
                activeMemos.setState([])
            }
        })
    },
})

export function registerEffects(navCtrl: NavigationController) {
    createEffect("ui/memoList/filter", {
        fn: async (_, { batch }) => {
            batch(() => actions.deactivateAllMemos())
        },
        deps: [memoList.filter],
        autoMount: true,
    })

    createEffect("ui/activeMemos", {
        fn: async () => {
            if (activeMemos.state.length === 0 && navCtrl.currentState.screen !== "list") {
                navCtrl.push({
                    screen: "list",
                    params: {},
                })
                return
            }

            if (
                (navCtrl.currentState.screen !== "memos" && activeMemos.state.length !== 0) ||
                ("ids" in navCtrl.currentState.params &&
                    activeMemos.state.length !== 0 &&
                    navCtrl.currentState.params.ids[0] !== activeMemos.state[0])
            ) {
                navCtrl.push({
                    screen: "memos",
                    params: {
                        ids: [...activeMemos.state],
                    },
                })
                return
            }
        },
        deps: [activeMemos],
        autoMount: true,
    })

    navCtrl.addEventListener("pop", ({ screen, params }) => {
        if (screen !== "list" && screen !== "memos") {
            return
        }

        if (screen === "list") {
            actions.deactivateAllMemos()
            return
        }

        let ids = "ids" in params ? params.ids : undefined
        if (!ids) {
            return
        }

        if (activeMemos.state.includes(ids[0])) {
            return
        }

        actions.openMemo(ids[0])
    })

    navCtrl.addEventListener("push", ({ screen, params }) => {
        if (screen !== "list" && screen !== "memos") {
            return
        }

        if (screen === "list") {
            actions.deactivateAllMemos()
            return
        }

        let ids = "ids" in params ? params.ids : undefined
        if (!ids) {
            return
        }

        if (activeMemos.state.includes(ids[0])) {
            return
        }

        actions.openMemo(ids[0])
    })
}
