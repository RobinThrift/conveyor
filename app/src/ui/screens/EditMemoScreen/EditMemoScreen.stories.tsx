import type { Meta, StoryObj } from "@storybook/react-vite"
import React, { useEffect } from "react"

import { withMockBackend } from "@/lib/testhelper/storybook"
import { actions } from "@/ui/stores"

import { EditMemoScreen, type EditMemoScreenProps } from "./EditMemoScreen"

import "@/ui/styles/index.css"

const meta: Meta<typeof EditMemoScreen> = {
    title: "Screens/Memos/Edit",
    component: EditMemoScreen,

    parameters: {
        layout: "fullscreen",
    },

    decorators: [
        withMockBackend({ generateMockData: true }),
        (Story) => (
            <main className="container mx-auto">
                <Story />
            </main>
        ),
    ],
}

export default meta
type Story = StoryObj<EditMemoScreenProps & { memoID: string }>

export const Edit: Story = {
    args: {
        memoID: "10-1",
    },
    decorators: [
        (Story, { args }) => {
            useEffect(() => {
                actions.memos.single.setSingleID(args.memoID)
            }, [args.memoID])

            return <Story />
        },
    ],
}
