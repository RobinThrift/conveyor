import type { Meta, StoryObj } from "@storybook/react-vite"
import { useStore } from "@tanstack/react-store"
import React, { useEffect } from "react"

import { withMockBackend } from "@/lib/testhelper/storybook"
import { useNavigation } from "@/ui/navigation"
import { actions, stores } from "@/ui/stores"
import "@/ui/styles/index.css"

import { InitSetupScreen } from "./InitSetupScreen"

const meta: Meta<typeof InitSetupScreen> = {
    title: "Screens/InitSetup",
    component: InitSetupScreen,

    decorators: [withMockBackend({})],
}

export default meta
type Story = StoryObj<typeof InitSetupScreen>

export const InitSetup: Story = {
    parameters: {
        layout: "fullscreen",
    },

    render: () => {
        let status = useStore(stores.setup.step)
        let nav = useNavigation()

        useEffect(() => {
            nav.push("setup", {}, { scrollOffsetTop: 0 })
        }, [nav.push])

        useEffect(() => {
            if (status === "unknown") {
                actions.setup.setStep("initial-setup")
            }
        }, [status])

        return (
            <main className="main">
                <InitSetupScreen />
            </main>
        )
    },
}
