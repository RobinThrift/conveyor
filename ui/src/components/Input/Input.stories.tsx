import * as Form from "@radix-ui/react-form"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { Input } from "./Input"

import "@/index.css"
import { GlobeX, User } from "@phosphor-icons/react"
import { Button } from "../Button"

const meta: Meta<typeof Input> = {
    title: "Components/Input",
    component: Input,
}

export default meta
type Story = StoryObj<typeof Input>

export const Overview: Story = {
    args: {
        placeholder: "Enter something interesting...",
        icon: <GlobeX />,
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
        message: "InputError",
        messages: { InputError: "Translated Error Message" },
        value: "invalid",
        icon: <User />,
    },
    render: (args) => (
        <Form.Root className="container mx-auto max-w-[300px]">
            <Input {...args} />
        </Form.Root>
    ),
}

export const WithValidation: Story = {
    args: {
        label: "Required Field",
        description: "Hit Enter to trigger validation",
        messages: { "Invalid/Empty": "Please enter a value" },
        value: "",
        icon: <User />,
        required: true,
    },
    render: (args) => (
        <Form.Root className="container mx-auto max-w-[300px]">
            <Input {...args} />
            <Button size="sm" type="reset" className="mt-5">
                Reset
            </Button>
        </Form.Root>
    ),
}
