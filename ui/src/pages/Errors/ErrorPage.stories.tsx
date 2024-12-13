import { Provider } from "@/state"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { ErrorPage } from "./ErrorPage"

import "@/index.css"

const meta: Meta<typeof ErrorPage> = {
    title: "Pages/Error",
    component: ErrorPage,

    decorators: (Story, { globals: { configureMockRootStore } }) => (
        <Provider store={configureMockRootStore()}>
            <Story />
        </Provider>
    ),
}

export default meta

type Story = StoryObj<typeof ErrorPage>

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
