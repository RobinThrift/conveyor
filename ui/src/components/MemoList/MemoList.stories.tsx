import { action } from "@storybook/addon-actions"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import { Provider } from "@/state"

import { mockData } from "../../../.storybook/mockapi"
import { MemoList } from "./MemoList"

import "@/index.css"

const meta: Meta<typeof MemoList> = {
    title: "Components/MemoList",
    component: MemoList,

    decorators: (Story, { globals: { configureMockRootStore } }) => (
        <Provider store={configureMockRootStore()}>
            <Story />
        </Provider>
    ),
}

export default meta
type Story = StoryObj<typeof MemoList>

export const Overview: Story = {
    name: "MemoList",
    args: {
        memos: mockData.memos,
        actions: {
            edit: action("edit"),
            archive: action("archive"),
            delete: action("delete"),
        },
    },
}
