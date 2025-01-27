import { Provider } from "@/state"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { MemosListPage } from "./MemosListPage"

import "@/index.css"

const meta: Meta<typeof MemosListPage> = {
    title: "Pages/Memos/List",
    component: MemosListPage,

    args: {
        filter: {},
    },

    decorators: (Story, { globals: { configureMockRootStore } }) => (
        <Provider store={configureMockRootStore()}>
            <main className="main pt-0 mx-auto">
                <Story />
            </main>
        </Provider>
    ),
}

export default meta
type Story = StoryObj<typeof MemosListPage>

export const List: Story = {}
