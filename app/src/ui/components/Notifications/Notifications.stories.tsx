import { faker } from "@faker-js/faker"
import { Info, Warning, X } from "@phosphor-icons/react"
import type { Meta, StoryObj } from "@storybook/react"
import React, { useCallback, useState } from "react"

import { decorator } from "@/lib/testhelper/rootStore"
import { Button } from "@/ui/components/Button"
import { useNotificationDispatcher } from "@/ui/state/global/notifications"
import "@/ui/styles/index.css"

import { Notifications } from "./Notifications"

const meta: Meta<typeof Notifications> = {
    title: "Components/Notifications",
    component: Notifications,
    decorators: [decorator],
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
        let addNotification = useNotificationDispatcher()
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
                    <Button onPress={onClickInfo}>Add Info Notification</Button>
                    <Button onPress={onClickError} variant="danger">
                        Add Error Notification
                    </Button>

                    <Button onPress={onClickRequiresAction}>
                        Add Notification that requires action
                    </Button>
                </div>

                <hr className="my-8" />

                <div className="flex flex-col gap-4 mt-8 w-[390px]">
                    <div className="notification info">
                        <div className="notification-title">
                            <div className="icon">
                                <Info />
                            </div>
                            Example Info Notification
                        </div>
                        <button
                            className="notification-close"
                            type="button"
                            aria-label="Dismiss"
                            data-radix-toast-announce-exclude
                        >
                            <X />
                        </button>
                        <div className="notification-message">
                            {faker.lorem.sentence()}
                        </div>

                        <div className="notification-buttons">
                            <Button>Undo</Button>
                        </div>
                    </div>

                    <div className="notification error">
                        <div className="notification-title">
                            <div className="icon">
                                <Warning />
                            </div>
                            Error Info Notification
                        </div>
                        <button
                            className="notification-close"
                            type="button"
                            aria-label="Dismiss"
                            data-radix-toast-announce-exclude
                        >
                            <X />
                        </button>
                        <div className="notification-message">
                            {faker.lorem.sentence()}
                        </div>

                        <div className="notification-buttons">
                            <Button>Retry</Button>
                        </div>
                    </div>

                    <div className="notification info">
                        <div className="notification-title">
                            <div className="icon">
                                <Info />
                            </div>
                            Example Notification with very, mutliline text and
                            multiple sentences of message.
                        </div>
                        <button
                            className="notification-close"
                            type="button"
                            aria-label="Dismiss"
                            data-radix-toast-announce-exclude
                        >
                            <X />
                        </button>
                        <div className="notification-message">
                            {faker.lorem.sentences(4)}
                        </div>

                        <div className="notification-buttons">
                            <Button variant="danger">Delete</Button>
                            <Button outline>Cancel</Button>
                        </div>
                    </div>
                </div>

                <Notifications {...args} />
            </div>
        )
    },
}
