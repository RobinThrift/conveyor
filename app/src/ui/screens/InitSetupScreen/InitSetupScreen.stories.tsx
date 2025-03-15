import type { Meta, StoryObj } from "@storybook/react"
import React, { useEffect } from "react"

import { decorator } from "@/lib/testhelper/rootStore"
import { actions, selectors } from "@/ui/state"
import { slice as router } from "@/ui/state/global/router"
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
        let dispatch = useDispatch()

        useEffect(() => {
            dispatch(router.actions.goto({ path: "/setup" }))
        }, [dispatch])

        useEffect(() => {
            if (status === "unknown") {
                dispatch(actions.setup.loadSetupInfo())
            }
        }, [status, dispatch])

        return <InitSetupScreen />
    },
}
