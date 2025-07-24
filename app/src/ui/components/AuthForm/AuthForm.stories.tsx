import type { Meta, StoryObj } from "@storybook/react-vite"
import { useStore } from "@tanstack/react-store"
import React from "react"

import { withMockBackend } from "@/lib/testhelper/storybook"
import { actions, stores } from "@/ui/stores"

import { AuthForm } from "./AuthForm"

const meta: Meta<typeof AuthForm> = {
    title: "Components/AuthForm",
    component: AuthForm,
    decorators: [withMockBackend({})],
}

export default meta
type Story = StoryObj<typeof AuthForm>

export const Overview: Story = {
    name: "AuthForm",
    render: (args) => {
        let status = useStore(stores.auth.status)
        let error = useStore(stores.auth.error)

        return (
            <div className="container mx-auto max-w-[1000px] space-y-4">
                <AuthForm
                    {...args}
                    status={status}
                    error={error}
                    login={(args) => {
                        actions.auth.authenticate(args)
                    }}
                    changePassword={(args) => {
                        actions.auth.changePassword(args)
                    }}
                />

                <div>Current authentication status: {status}</div>

                <div className="flex gap-4 justify-stretch">
                    <div>
                        <h3 className="font-semibold text-lg">Regular Authentication</h3>
                        <dl>
                            <div className="flex gap-2">
                                <dt>Username:</dt>
                                <dd>
                                    <code>test</code>
                                </dd>
                            </div>
                            <div className="flex gap-2">
                                <dt>Password:</dt>
                                <dd>
                                    <code>passwd</code>
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg">Requires Password Change</h3>
                        <dl>
                            <div className="flex gap-2">
                                <dt>Username:</dt>
                                <dd>
                                    <code>change</code>
                                </dd>
                            </div>
                            <div className="flex gap-2">
                                <dt>Password:</dt>
                                <dd>
                                    <code>passwd</code>
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        )
    },
}
