import type { Meta, StoryObj } from "@storybook/react-vite"
import React, { useEffect } from "react"
import { useDispatch } from "react-redux"

import { decoratorWithMockData } from "@/lib/testhelper/rootStore"
import { actions } from "@/ui/state"
import "@/ui/styles/index.css"

import { EditMemoScreen, type EditMemoScreenProps } from "./EditMemoScreen"

const meta: Meta<typeof EditMemoScreen> = {
    title: "Screens/Memos/Edit",
    component: EditMemoScreen,

    parameters: {
        layout: "fullscreen",
    },

    decorators: [
        decoratorWithMockData,
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
            let dispatch = useDispatch()
            useEffect(() => {
                dispatch(
                    actions.memos.setCurrentSingleMemoID({ id: args.memoID }),
                )
            }, [dispatch, args.memoID])

            return <Story />
        },
    ],
}
