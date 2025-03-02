import { faker } from "@faker-js/faker"
import { action } from "@storybook/addon-actions"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import { Button } from "@/ui/components/Button"

import { Dialog } from "./Dialog"

const meta: Meta<typeof Dialog> = {
    title: "Components/Dialog",
    component: Dialog,
}

export default meta
type Story = StoryObj<typeof Dialog>

export const Overview: Story = {
    name: "Dialog",
    args: {
        children: [
            <Dialog.Trigger key="trigger">Open Dialog</Dialog.Trigger>,
            <Dialog.Content key="content">
                <Dialog.Title>Dialog Title</Dialog.Title>
                <Dialog.Description>
                    {faker.lorem.sentence()}
                </Dialog.Description>

                {faker.lorem
                    .sentences({ min: 5, max: 10 })
                    .split(".")
                    .filter((sentence) => sentence.length !== 0)
                    .map((sentence) => (
                        <p key={sentence}>{sentence}.</p>
                    ))}

                <Dialog.Buttons>
                    <Button variant="success" onClick={action("ok")}>
                        Ok
                    </Button>
                    <Dialog.CloseButton onClick={action("close")}>
                        Close
                    </Dialog.CloseButton>
                </Dialog.Buttons>
            </Dialog.Content>,
        ],
    },
}

export const Design: Story = {
    name: "Design",
    args: {
        open: true,
        children: [
            <Dialog.Content key="content">
                <Dialog.Title>Dialog Title</Dialog.Title>
                <Dialog.Description>
                    {faker.lorem.sentence()}
                </Dialog.Description>

                {faker.lorem
                    .sentences({ min: 5, max: 10 })
                    .split(".")
                    .filter((sentence) => sentence.length !== 0)
                    .map((sentence) => (
                        <p key={sentence}>{sentence}.</p>
                    ))}

                <Dialog.Buttons>
                    <Button variant="success">Ok</Button>
                    <Dialog.CloseButton>Close</Dialog.CloseButton>
                </Dialog.Buttons>
            </Dialog.Content>,
        ],
    },
}
