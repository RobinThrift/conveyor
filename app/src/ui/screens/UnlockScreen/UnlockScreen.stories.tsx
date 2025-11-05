import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import { setEnv } from "@/env"
import { withMockBackend } from "@/lib/testhelper/storybook"
import { Button } from "@/ui/components/Button"

import "@/ui/styles/index.css"

import { stores } from "@/ui/stores"
import { UnlockScreen } from "./UnlockScreen"

setEnv({
    isDeviceSecureStorageAvailable: true,
})

const meta: Meta<typeof UnlockScreen> = {
    title: "Screens/Unlock",
    component: UnlockScreen,

    decorators: [
        withMockBackend({}),
        (Story) => (
            <>
                <Story />
                <ResetButton />
            </>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof UnlockScreen>

export const Unlock: Story = {
    parameters: {
        layout: "fullscreen",
    },
}

function ResetButton() {
    return (
        <Button
            variant="danger"
            className="absolute bottom-2 right-2 z-100"
            onClick={() => {
                stores.unlock.status.setState("locked")
                stores.unlock.error.setState(undefined)
            }}
        >
            Reset
        </Button>
    )
}
