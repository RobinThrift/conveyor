import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"
import { action } from "storybook/actions"

import { Button } from "@/ui/components/Button"
import "@/ui/styles/index.css"

import { Dialog } from "./Dialog"

const meta: Meta<typeof Dialog> = {
    title: "Components/Dialog",
    component: Dialog,
    parameters: {
        layout: "fullscreen",
    },
}

export default meta
type Story = StoryObj<typeof Dialog>

export const Overview: Story = {
    name: "Dialog",
    args: {
        isModal: true,
        onClose: action("closed"),
        children: [
            <Dialog.Trigger key="trigger">Open Dialog</Dialog.Trigger>,
            <Dialog.Content key="content">
                <Dialog.Title>Dialog Title</Dialog.Title>
                <Dialog.Description>{faker.lorem.sentence()}</Dialog.Description>

                {faker.lorem
                    .sentences({ min: 5, max: 10 })
                    .split(".")
                    .filter((sentence) => sentence.length !== 0)
                    .map((sentence) => (
                        <p key={sentence}>{sentence}.</p>
                    ))}

                <Dialog.Buttons>
                    <Button variant="primary" onClick={action("ok")}>
                        Ok
                    </Button>
                    <Dialog.CloseButton>Close</Dialog.CloseButton>
                </Dialog.Buttons>
            </Dialog.Content>,
        ],
    },

    render(args) {
        return (
            <main className="w-screen h-screen flex flex-col items-center justify-center">
                <div className="max-w-lg px-2 gap-2 flex flex-col">
                    <p>{faker.lorem.sentences(5)}</p>

                    <Dialog {...args} />

                    <p>{faker.lorem.sentences(5)}</p>
                </div>
            </main>
        )
    },
}

export const Design: Story = {
    args: {
        open: true,
        isModal: true,
        children: [
            <Dialog.Content key="content">
                <Dialog.Title>Dialog Title</Dialog.Title>
                <Dialog.Description>{faker.lorem.sentence()}</Dialog.Description>

                {faker.lorem
                    .sentences({ min: 5, max: 10 })
                    .split(".")
                    .filter((sentence) => sentence.length !== 0)
                    .map((sentence) => (
                        <p key={sentence}>{sentence}.</p>
                    ))}

                <Dialog.Buttons>
                    <Button variant="primary">Ok</Button>
                    <Dialog.CloseButton>Close</Dialog.CloseButton>
                </Dialog.Buttons>
            </Dialog.Content>,
        ],
    },

    render(args) {
        return (
            <main className="w-screen h-screen flex flex-col items-center justify-center">
                <div className="max-w-lg px-2 gap-2 flex flex-col">
                    <p>{faker.lorem.sentences({ min: 5, max: 10 })}</p>
                    <img
                        src={faker.image.urlPicsumPhotos({
                            width: 500,
                            height: 340,
                        })}
                        alt="img 1"
                    />
                    <p>{faker.lorem.sentences({ min: 5, max: 10 })}</p>
                    <p>{faker.lorem.sentences({ min: 5, max: 10 })}</p>
                    <img
                        src={faker.image.urlPicsumPhotos({
                            width: 500,
                            height: 340,
                        })}
                        alt="img 1"
                    />
                    <p>{faker.lorem.sentences({ min: 5, max: 10 })}</p>
                    <img
                        src={faker.image.urlPicsumPhotos({
                            width: 500,
                            height: 340,
                        })}
                        alt="img 1"
                    />
                    <p>{faker.lorem.sentences({ min: 5, max: 10 })}</p>
                </div>
                <Dialog {...args} />
            </main>
        )
    },
}

export const Nested: Story = {
    render: () => {
        return (
            <main>
                <NestedDialog>
                    <Dialog isModal={true} isKeyboardDismissable={false}>
                        <Dialog.Trigger key="trigger">Open Dialog</Dialog.Trigger>
                        <Dialog.Content key="content">
                            <Dialog.Title>Dialog Title</Dialog.Title>
                            <Dialog.Description>{faker.lorem.sentence()}</Dialog.Description>

                            {faker.lorem
                                .sentences({ min: 5, max: 10 })
                                .split(".")
                                .filter((sentence) => sentence.length !== 0)
                                .map((sentence) => (
                                    <p key={sentence}>{sentence}.</p>
                                ))}

                            <Dialog.Buttons>
                                <Button variant="primary" onClick={action("ok")}>
                                    Ok
                                </Button>
                                <Dialog.CloseButton>Close</Dialog.CloseButton>
                            </Dialog.Buttons>
                        </Dialog.Content>
                    </Dialog>
                </NestedDialog>
            </main>
        )
    },
}

function NestedDialog(props: React.PropsWithChildren) {
    return (
        <Dialog isModal={true} isKeyboardDismissable={false}>
            <Dialog.Trigger key="trigger">Open Dialog</Dialog.Trigger>
            <Dialog.Content key="content">
                <Dialog.Title>Dialog Title</Dialog.Title>
                <Dialog.Description>{faker.lorem.sentence()}</Dialog.Description>

                {faker.lorem
                    .sentences(5)
                    .split(".")
                    .filter((sentence) => sentence.length !== 0)
                    .map((sentence) => (
                        <p key={sentence}>{sentence}.</p>
                    ))}

                {props.children}
            </Dialog.Content>
        </Dialog>
    )
}
