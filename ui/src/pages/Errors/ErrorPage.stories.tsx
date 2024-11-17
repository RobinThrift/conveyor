import type { Meta, StoryObj } from "@storybook/react"
import { ErrorPage } from "./ErrorPage"

import "@/index.css"

const meta: Meta<typeof ErrorPage> = {
    title: "Pages/Error",
    component: ErrorPage,
}

export default meta

type Story = StoryObj<typeof ErrorPage>

export const NotFound: Story = {
    args: {
        code: 404,
        title: "Not Found",
        detail: "The requested page was not found.",
    },
}

export const Unauthorized: Story = {
    args: {
        code: 401,
        title: "Unauthorized",
        detail: "You are not authorized to see this page.",
    },
}

export const InternalServerError: Story = {
    args: {
        code: 500,
        title: "Internal Server Error",
        detail: "Unknown internal server error.",
    },
}
