import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import "@/ui/styles/index.css"
import { Button } from "@/ui/components/Button"
import { Form } from "@/ui/components/Form"
import { CodeIcon, KeyIcon } from "@/ui/components/Icons"

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
        message: "InputError",
        messages: { InputError: "Translated Error Message" },
        defaultValue: "invalid",
        icon: <KeyIcon />,
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
        icon: <KeyIcon />,
        required: true,
    },
    render: (args) => (
        <Form className="container mx-auto max-w-[300px]">
            <Input {...args} />
            <Button type="reset" className="mt-5">
                Reset
            </Button>
        </Form>
    ),
}
