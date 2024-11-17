import type { Meta, StoryObj } from "@storybook/react"
import { APIDocsPage } from "./APIDocsPage"

const meta: Meta<typeof APIDocsPage> = {
    title: "Pages/APIDocs",
    component: APIDocsPage,
}

export default meta

type Story = StoryObj<typeof APIDocsPage>

export const APIDocs: Story = {
    args: {
        url: "/src/api/apiv1.openapi3.yaml",
    },
}
