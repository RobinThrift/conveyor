import {
    combineSlices,
    configureStore,
    createListenerMiddleware,
} from "@reduxjs/toolkit"
import type { Decorator, Meta, StoryObj } from "@storybook/react"
import React from "react"
import { Provider as ReduxProvider, useDispatch } from "react-redux"

import "@/ui/styles/index.css"
import { setEnv } from "@/env"
import { Second } from "@/lib/duration"
import { delay } from "@/lib/testhelper/delay"
import { actions } from "@/ui/state"
import * as unlock from "@/ui/state/unlock"

import { Button } from "@/ui/components/Button"
import { UnlockScreen } from "./UnlockScreen"

setEnv({
    isDeviceSecureStorageAvailable: true,
})

const unlockScreenRootStore = (() => {
    const listenerMiddleware = createListenerMiddleware()
    let store = configureStore({
        reducer: combineSlices(unlock.slice),
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: false,
            }).prepend(listenerMiddleware.middleware),
    })

    listenerMiddleware.startListening({
        actionCreator: actions.unlock.unlock,
        effect: async (_, { cancelActiveListeners, dispatch }) => {
            cancelActiveListeners()

            await delay(5 * Second)

            dispatch(
                actions.unlock.setUnlockState({
                    state: "unlocked",
                }),
            )
        },
    })

    return store
})()

const decorator: Decorator = (Story) => (
    <ReduxProvider store={unlockScreenRootStore}>
        <Story />
        <ResetButton />
    </ReduxProvider>
)

const meta: Meta<typeof UnlockScreen> = {
    title: "Screens/Unlock",
    component: UnlockScreen,

    decorators: [decorator],
}

export default meta
type Story = StoryObj<typeof UnlockScreen>

export const Unlock: Story = {
    parameters: {
        layout: "fullscreen",
    },
}

function ResetButton() {
    let dispatch = useDispatch()

    return (
        <Button
            variant="danger"
            size="sm"
            className="absolute bottom-2 right-2 z-100"
            onPress={() => {
                dispatch(
                    actions.unlock.setUnlockState({
                        state: "locked",
                    }),
                )
            }}
        >
            Reset
        </Button>
    )
}
