import * as Form from "@radix-ui/react-form"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { Input } from "./Input"

import "@/index.css"
import { Password } from "@phosphor-icons/react"

const meta: Meta<typeof Input> = {
    title: "Components/Input",
    component: Input,
}

export default meta
type Story = StoryObj<typeof Input>

export const Overview: Story = {
    args: {
        placeholder: "enter a value",
        icon: <Password />,
    },
    render: (args) => (
        <Form.Root className="container mx-auto max-w-[300px]">
            <Input {...args} />
        </Form.Root>
    ),
}

export const WithError: Story = {
    args: {
        label: "Input Field",
        serverInvalid: true,
        message: "Input error",
        value: "error value",
        icon: <Password />,
    },
    render: (args) => (
        <Form.Root className="container mx-auto max-w-[300px]">
            <Input {...args} />
        </Form.Root>
    ),
}
