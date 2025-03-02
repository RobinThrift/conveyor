import { faker } from "@faker-js/faker"
import { action } from "@storybook/addon-actions"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import { Button } from "@/ui/components/Button"
import "@/ui/styles/index.css"

import { AlertDialog } from "./AlertDialog"

const meta: Meta<typeof AlertDialog> = {
    title: "Components/AlertDialog",
    component: AlertDialog,
}

export default meta
type Story = StoryObj<typeof AlertDialog>

export const Overview: Story = {
    name: "AlertDialog",
    args: {
        children: [
            <AlertDialog.Trigger key="trigger">
                Open AlertDialog
            </AlertDialog.Trigger>,
            <AlertDialog.Content key="content">
                <AlertDialog.Title>AlertDialog Title</AlertDialog.Title>
                <AlertDialog.Description>
                    {faker.lorem.sentence()}
                </AlertDialog.Description>

                {faker.lorem
                    .sentences({ min: 5, max: 10 })
                    .split(".")
                    .filter((sentence) => sentence.length !== 0)
                    .map((sentence) => (
                        <p key={sentence}>{sentence}.</p>
                    ))}

                <AlertDialog.Buttons>
                    <Button variant="danger" onClick={action("delete")}>
                        Delete
                    </Button>
                    <AlertDialog.CancelButton onClick={action("cancel")}>
                        Cancel
                    </AlertDialog.CancelButton>
                </AlertDialog.Buttons>
            </AlertDialog.Content>,
        ],
    },
}

export const Design: Story = {
    name: "Design",
    args: {
        open: true,
        children: [
            <AlertDialog.Content key="content">
                <AlertDialog.Title>AlertDialog Title</AlertDialog.Title>
                <AlertDialog.Description>
                    {faker.lorem.sentence()}
                </AlertDialog.Description>

                {faker.lorem
                    .sentences({ min: 5, max: 10 })
                    .split(".")
                    .filter((sentence) => sentence.length !== 0)
                    .map((sentence) => (
                        <p key={sentence}>{sentence}.</p>
                    ))}

                <AlertDialog.Buttons>
                    <Button variant="danger">Delete</Button>
                    <AlertDialog.CancelButton>Cancel</AlertDialog.CancelButton>
                </AlertDialog.Buttons>
            </AlertDialog.Content>,
        ],
    },
}
