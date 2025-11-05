import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react-vite"
import React, { useCallback, useState } from "react"

import { withMockBackend } from "@/lib/testhelper/storybook"
import { Button } from "@/ui/components/Button"
import { InfoIcon, WarningIcon, XIcon } from "@/ui/components/Icons"

import "@/ui/styles/index.css"

import { Notifications } from "./Notifications"

const meta: Meta<typeof Notifications> = {
    title: "Components/Notifications",
    component: Notifications,
    decorators: [withMockBackend({})],
}

export default meta
type Story = StoryObj<typeof Notifications>

export const Overview: Story = {
    name: "Notifications",

    parameters: {
        layout: "fullscreen",
    },

    render: (args) => {
        let [count, setCount] = useState(0)
        let addNotification = (() => {}) as any
        let onClickInfo = useCallback(() => {
            addNotification({
                type: "info",
                title: `Notification ${count}`,
                message: faker.lorem.sentence(),
                buttons: [
                    {
                        children: "Undo",
                        ariaLabel: "Undo",
                        outline: true,
                        variant: "primary",
                    },
                ],
            })
            setCount(count + 1)
        }, [count, addNotification])

        let onClickError = useCallback(() => {
            addNotification({
                type: "error",
                title: `Error ${count}`,
                message: faker.lorem.sentence(),
                buttons: [
                    {
                        children: "Retry",
                        ariaLabel: "Retry",
                    },
                ],
            })
            setCount(count + 1)
        }, [count, addNotification])

        let onClickRequiresAction = useCallback(() => {
            addNotification({
                type: "info",
                title: `Requires Action (${count})`,
                message: faker.lorem.sentence(),
                requiresAction: true,
                buttons: [
                    {
                        children: "Update",
                        ariaLabel: "Update",
                    },
                ],
            })
            setCount(count + 1)
        }, [count, addNotification])

        return (
            <div className="container mx-auto py-8">
                <div className="flex gap-2">
                    <Button onClick={onClickInfo}>Add Info Notification</Button>
                    <Button onClick={onClickError} variant="danger">
                        Add Error Notification
                    </Button>

                    <Button onClick={onClickRequiresAction}>
                        Add Notification that requires action
                    </Button>
                </div>

                <hr className="my-8" />

                <div className="flex flex-col gap-4 mt-8 w-[390px]">
                    <div className="notification info">
                        <div className="notification-title">
                            <div className="icon">
                                <InfoIcon />
                            </div>
                            Example Info Notification
                        </div>
                        <button
                            className="notification-close"
                            type="button"
                            aria-label="Dismiss"
                            data-radix-toast-announce-exclude
                        >
                            <XIcon />
                        </button>
                        <div className="notification-message">{faker.lorem.sentence()}</div>

                        <div className="notification-buttons">
                            <Button>Undo</Button>
                        </div>
                    </div>

                    <div className="notification error">
                        <div className="notification-title">
                            <div className="icon">
                                <WarningIcon />
                            </div>
                            Error Info Notification
                        </div>
                        <button
                            className="notification-close"
                            type="button"
                            aria-label="Dismiss"
                            data-radix-toast-announce-exclude
                        >
                            <XIcon />
                        </button>
                        <div className="notification-message">{faker.lorem.sentence()}</div>

                        <div className="notification-buttons">
                            <Button>Retry</Button>
                        </div>
                    </div>

                    <div className="notification info">
                        <div className="notification-title">
                            <div className="icon">
                                <InfoIcon />
                            </div>
                            Example Notification with very, mutliline text and multiple sentences of
                            message.
                        </div>
                        <button
                            className="notification-close"
                            type="button"
                            aria-label="Dismiss"
                            data-radix-toast-announce-exclude
                        >
                            <XIcon />
                        </button>
                        <div className="notification-message">{faker.lorem.sentences(4)}</div>

                        <div className="notification-buttons">
                            <Button variant="danger">Delete</Button>
                            <Button>Cancel</Button>
                        </div>
                    </div>
                </div>

                <Notifications {...args} />
            </div>
        )
    },
}
