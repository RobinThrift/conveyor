import type { Meta, StoryObj } from "@storybook/react-vite"
import React, { useEffect } from "react"

import { decorator } from "@/lib/testhelper/rootStore"
import { useNavigation } from "@/ui/navigation"
import { actions, selectors } from "@/ui/state"
import { useDispatch, useSelector } from "react-redux"
import "@/ui/styles/index.css"

import { InitSetupScreen } from "./InitSetupScreen"

const meta: Meta<typeof InitSetupScreen> = {
    title: "Screens/InitSetup",
    component: InitSetupScreen,

    decorators: [decorator],
}

export default meta
type Story = StoryObj<typeof InitSetupScreen>

export const InitSetup: Story = {
    parameters: {
        layout: "fullscreen",
    },

    render: () => {
        let status = useSelector(selectors.setup.step)
        let nav = useNavigation()
        let dispatch = useDispatch()

        useEffect(() => {
            nav.push("setup", {}, { scrollOffsetTop: 0 })
        }, [nav.push])

        useEffect(() => {
            if (status === "unknown") {
                dispatch(actions.setup.loadSetupInfo())
            }
        }, [status, dispatch])

        return (
            <main className="main">
                <InitSetupScreen />
            </main>
        )
    },
}
