import type { Meta, StoryObj } from "@storybook/react-vite"
import React, { useEffect } from "react"

import { withMockBackend } from "@/lib/testhelper/storybook"
import { actions } from "@/ui/stores"

import "@/ui/styles/index.css"

import { SingleMemoScreen, type SingleMemoScreenProps } from "./SingleMemoScreen"

const meta: Meta<typeof SingleMemoScreen> = {
    title: "Screens/Memos/Single",
    component: SingleMemoScreen,

    decorators: [withMockBackend({ generateMockData: true })],
}

export default meta
type Story = StoryObj<SingleMemoScreenProps & { memoID: string }>

export const Single: Story = {
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
