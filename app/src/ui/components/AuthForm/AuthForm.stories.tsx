import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"
import { useDispatch, useSelector } from "react-redux"

import { decorator } from "@/lib/testhelper/rootStore"
import { actions, selectors } from "@/ui/state"

import { AuthForm } from "./AuthForm"

const meta: Meta<typeof AuthForm> = {
    title: "Components/AuthForm",
    component: AuthForm,
    decorators: [decorator],
}

export default meta
type Story = StoryObj<typeof AuthForm>

export const Overview: Story = {
    name: "AuthForm",
    render: (args) => {
        let dispatch = useDispatch()
        let status = useSelector(selectors.auth.status)
        let error = useSelector(selectors.auth.error)

        return (
            <div className="container mx-auto max-w-[1000px] space-y-4">
                <AuthForm
                    {...args}
                    status={status}
                    error={error}
                    login={(args) => {
                        dispatch(actions.auth.authenticate(args))
                    }}
                    changePassword={(args) => {
                        dispatch(actions.auth.changePassword(args))
                    }}
                />

                <div>Current authentication status: {status}</div>

                <div className="flex gap-4 justify-stretch">
                    <div>
                        <h3 className="font-semibold text-lg">
                            Regular Authentication
                        </h3>
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
                        <h3 className="font-semibold text-lg">
                            Requires Password Change
                        </h3>
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
