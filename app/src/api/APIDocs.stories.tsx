import type { Meta, StoryObj } from "@storybook/react"

import { APIDocs } from "@/lib/testhelper/APIDocs"

const meta: Meta<typeof APIDocs> = {
    title: "API",
    component: APIDocs,
}

export default meta

type Story = StoryObj<typeof APIDocs>

export const SyncV1: Story = {
    name: "Sync/V1",
    args: {
        url: "/assets/apispecs/sync.v1.openapi3.yaml",
    },

    parameters: {
        layout: "fullscreen",
    },
}

export const AuthV1: Story = {
    name: "Auth/V1",
    args: {
        url: "/assets/apispecs/auth.v1.openapi3.yaml",
    },

    parameters: {
        layout: "fullscreen",
    },
}

export const MemosV1: Story = {
    name: "Memos/V1",
    args: {
        url: "/assets/apispecs/memos.v1.openapi3.yaml",
    },

    parameters: {
        layout: "fullscreen",
    },
}
