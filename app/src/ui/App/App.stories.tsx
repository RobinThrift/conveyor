import type { Meta, StoryObj } from "@storybook/react-vite"

import { withMockBackend } from "@/lib/testhelper/storybook"

import { App, type AppProps } from "./App"

import "@/ui/styles/index.css"

const meta: Meta<AppProps> = {
    title: "Conveyor/App",
    component: App,
    parameters: {
        layout: "fullscreen",
    },
    decorators: [withMockBackend({ generateMockData: true })],
}

export default meta
type Story = StoryObj<AppProps>

export const Full: Story = {
    name: "App",
}
