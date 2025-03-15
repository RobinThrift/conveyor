import { Form } from "@radix-ui/react-form"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import "@/ui/styles/index.css"
import { Button } from "@/ui/components/Button"
import { CodeIcon, UserIcon } from "@/ui/components/Icons"

import { Input } from "./Input"

const meta: Meta<typeof Input> = {
    title: "Components/Input",
    component: Input,
}

export default meta
type Story = StoryObj<typeof Input>

export const Overview: Story = {
    args: {
        placeholder: "Enter something interesting...",
        icon: <CodeIcon />,
    },
    render: (args) => (
        <Form className="container mx-auto max-w-[300px]">
            <Input {...args} />
        </Form>
    ),
}

export const WithError: Story = {
    args: {
        label: "Input Field",
        serverInvalid: true,
        message: "InputError",
        messages: { InputError: "Translated Error Message" },
        value: "invalid",
        icon: <UserIcon />,
    },
    render: (args) => (
        <Form className="container mx-auto max-w-[300px]">
            <Input {...args} />
        </Form>
    ),
}

export const WithValidation: Story = {
    args: {
        label: "Required Field",
        description: "Hit Enter to trigger validation",
        messages: { "Invalid/Empty": "Please enter a value" },
        value: "",
        icon: <UserIcon />,
        required: true,
    },
    render: (args) => (
        <Form className="container mx-auto max-w-[300px]">
            <Input {...args} />
            <Button size="sm" type="reset" className="mt-5">
                Reset
            </Button>
        </Form>
    ),
}
