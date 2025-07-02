import type { Meta, StoryObj } from "@storybook/react-vite"
import React, { useEffect } from "react"
import { useDispatch } from "react-redux"

import { decoratorWithMockData } from "@/lib/testhelper/rootStore"
import { actions } from "@/ui/state"
import "@/ui/styles/index.css"

import { SingleMemoScreen, type SingleMemoScreenProps } from "./SingleMemoScreen"

const meta: Meta<typeof SingleMemoScreen> = {
    title: "Screens/Memos/Single",
    component: SingleMemoScreen,

    decorators: [decoratorWithMockData],
}

export default meta
type Story = StoryObj<SingleMemoScreenProps & { memoID: string }>

export const Single: Story = {
    args: {
        memoID: "10-1",
    },
    decorators: [
        (Story, { args }) => {
            let dispatch = useDispatch()
            useEffect(() => {
                dispatch(actions.memos.setCurrentSingleMemoID({ id: args.memoID }))
            }, [dispatch, args.memoID])

            return <Story />
        },
    ],
}
