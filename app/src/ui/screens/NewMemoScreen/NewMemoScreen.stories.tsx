import type { Meta, StoryObj } from "@storybook/react-vite"

import { withMockBackend } from "@/lib/testhelper/storybook"

import { NewMemoScreen } from "./NewMemoScreen"

import "@/ui/styles/index.css"

const meta: Meta<typeof NewMemoScreen> = {
    title: "Screens/Memos/New",
    component: NewMemoScreen,

    parameters: {
        layout: "fullscreen",
    },

    decorators: [withMockBackend({})],
}

export default meta
type Story = StoryObj<typeof NewMemoScreen>

export const New: Story = {}
