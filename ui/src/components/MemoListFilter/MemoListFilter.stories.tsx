import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import { Provider } from "@/state"

import { mockData } from "../../../.storybook/mockapi"
import { MemoListFilter } from "./MemoListFilter"

const meta: Meta<typeof MemoListFilter> = {
    title: "Components/MemoListFilter",
    component: MemoListFilter,
    args: {
        filter: {},
        tags: mockData.tags,
    },
    parameters: {
        layout: "fullscreen",
    },
    decorators: (Story, { globals: { configureMockRootStore } }) => (
        <Provider store={configureMockRootStore()}>
            <div className="mx-auto px-1 tablet:px-4 w-full max-w-[400px]">
                <Story />
            </div>
        </Provider>
    ),
}

export default meta
type Story = StoryObj<typeof MemoListFilter>

export const Overview: Story = {
    name: "MemoListFilter",
}
