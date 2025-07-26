import type { Meta, StoryObj } from "@storybook/react-vite"
import { withMockBackend } from "@/lib/testhelper/storybook"

import { AppHeader } from "./AppHeader"

import "@/ui/styles/index.css"

const meta: Meta<typeof AppHeader> = {
    title: "Components/AppHeader",
    component: AppHeader,
    decorators: [withMockBackend({})],
}

export default meta
type Story = StoryObj<typeof AppHeader>

export const Basic: Story = {
    name: "AppHeader",
    parameters: {
        layout: "fullscreen",
    },
}
