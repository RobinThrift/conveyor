import type { Meta, StoryObj } from "@storybook/react"
import React, { useEffect } from "react"
import { App, type AppProps } from "./App"
import { $router } from "./router"

import "@/index.css"

export interface AppStoryArgs extends AppProps {
    url: string
}

const meta: Meta<AppStoryArgs> = {
    title: "Belt/App",
    component: App,
}

export default meta
type Story = StoryObj<AppStoryArgs>

export const Full: Story = {
    name: "App",
    parameters: {
        layout: "fullscreen",
    },

    args: {
        url: "/",
    },

    render: (args) => {
        useEffect(() => {
            $router.open(args.url)
        }, [args.url])

        return <App {...args} />
    },
}
