import type { Meta, StoryObj } from "@storybook/react-vite"

import { decorator } from "@/lib/testhelper/rootStore"
import "@/ui/styles/index.css"

import { NewMemoScreen } from "./NewMemoScreen"

const meta: Meta<typeof NewMemoScreen> = {
    title: "Screens/Memos/New",
    component: NewMemoScreen,

    parameters: {
        layout: "fullscreen",
    },

    decorators: [decorator],
}

export default meta
type Story = StoryObj<typeof NewMemoScreen>

export const New: Story = {}
