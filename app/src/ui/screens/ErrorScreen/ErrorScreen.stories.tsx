import type { Meta, StoryObj } from "@storybook/react"
import { ErrorScreen } from "./ErrorScreen"

import "@/ui/styles/index.css"

const meta: Meta<typeof ErrorScreen> = {
    title: "Screens/Error",
    component: ErrorScreen,

    parameters: {
        layout: "fullscreen",
    },
}

export default meta

type Story = StoryObj<typeof ErrorScreen>

export const NotFound: Story = {
    args: {
        code: 404,
        t: "NotFound",
    },
}

export const Unauthorized: Story = {
    args: {
        code: 401,
        t: "Unauthorized",
    },
}

export const InternalServerError: Story = {
    args: {
        code: 500,
        title: "Internal Server Error",
        detail: "Unknown internal server error.",
    },
}
