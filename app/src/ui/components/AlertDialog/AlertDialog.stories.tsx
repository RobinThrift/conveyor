import { faker } from "@faker-js/faker"
import { action } from "@storybook/addon-actions"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import { Button } from "@/ui/components/Button"
import { WarningIcon } from "@/ui/components/Icons"
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
                <AlertDialog.Icon>
                    <WarningIcon />
                </AlertDialog.Icon>
                <AlertDialog.Description>
                    {faker.lorem.sentences({ min: 5, max: 10 })}
                </AlertDialog.Description>

                <AlertDialog.Buttons>
                    <Button variant="danger" onPress={action("delete")}>
                        Delete
                    </Button>
                    <AlertDialog.CancelButton onPress={action("cancel")}>
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
                <AlertDialog.Icon>
                    <WarningIcon />
                </AlertDialog.Icon>
                <AlertDialog.Description>
                    {faker.lorem.sentences({ min: 5, max: 10 })}
                </AlertDialog.Description>

                <AlertDialog.Buttons>
                    <Button variant="danger">Delete</Button>
                    <AlertDialog.CancelButton>Cancel</AlertDialog.CancelButton>
                </AlertDialog.Buttons>
            </AlertDialog.Content>,
        ],
    },
}
