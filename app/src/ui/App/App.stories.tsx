import type { Meta, StoryObj } from "@storybook/react"

import { decoratorWithMockData } from "@/lib/testhelper/rootStore"
import "@/ui/styles/index.css"

import { App, type AppProps } from "./App"

const meta: Meta<AppProps> = {
    title: "Belt/App",
    component: App,
    parameters: {
        layout: "fullscreen",
    },
    decorators: [decoratorWithMockData],
}

export default meta
type Story = StoryObj<AppProps>

export const Full: Story = {
    name: "App",
}
