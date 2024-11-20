import { Input } from "@/components/Input"
import { useBaseURL } from "@/hooks/useBaseURL"
import { useCSRFToken } from "@/hooks/useCSRFToken"
import { Password } from "@phosphor-icons/react"
import * as Form from "@radix-ui/react-form"
import React from "react"

export interface ChangePasswordPageProps {
    redirectURL: string
    validationErrors?: {
        form?: string
        current_password?: string
        new_password?: string
    }
}

export function ChangePasswordPage(props: ChangePasswordPageProps) {
    let csrfToken = useCSRFToken()
    let baseURL = useBaseURL()

    return (
        <div className="h-screen w-screen flex items-center justify-stretch md:justify-center bg-body bg-[radial-gradient(#d2d5da_1px,transparent_1px)] [background-size:16px_16px] lg:[mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]">
            <div className="flex items-center justify-center flex-col w-full md:w-[400px]">
                <div className="flex flex-col items-center justify-center">
                    <h3 className="text-xl mt-8 mb-3 font-semibold text-primary-extra-dark">
                        Change Password
                    </h3>
                </div>
                <Form.Root
                    action={`${baseURL}/auth/change_password`}
                    method="post"
                    className="w-full"
                >
                    <input
                        type="hidden"
                        id="belt.csrf.token"
                        name="belt.csrf.token"
                        defaultValue={csrfToken}
                    />

                    <input
                        type="hidden"
                        id="redirect_url"
                        name="redirect_url"
                        defaultValue={props.redirectURL}
                    />

                    <div className="flex flex-col px-3 py-2 w-full">
                        <Input
                            type="password"
                            name="current_password"
                            ariaLabel="Current Password"
                            icon={<Password />}
                            serverInvalid={
                                !!props.validationErrors?.current_password
                            }
                            inputClassName="rounded-b-none !border-b-transparent hover:border-b-subtle-dark focus:border-b-subtle-dark focus:z-10 relative"
                            iconClassName="z-20"
                            messageClassName="mt-0"
                            autoComplete="current_password"
                            placeholder="Current Password"
                            required
                            autoFocus
                        />

                        <Input
                            name="new_password"
                            type="password"
                            ariaLabel="New Password"
                            icon={<Password />}
                            serverInvalid={
                                !!props.validationErrors?.new_password
                            }
                            inputClassName="rounded-t-none !border-b-transparent hover:border-b-subtle-dark focus:border-b-subtle-dark focus:z-10 relative"
                            iconClassName="z-20"
                            autoComplete="new_password"
                            placeholder="New Password"
                            required
                        />

                        <Input
                            name="repeat_new_password"
                            type="password"
                            ariaLabel="Repeat New Password"
                            icon={<Password />}
                            serverInvalid={
                                !!props.validationErrors?.new_password
                            }
                            inputClassName="rounded-t-none hover:border-b-subtle-dark focus:border-b-subtle-dark"
                            autoComplete="repeat_new_password"
                            placeholder="Repeat New Password"
                            required
                        />

                        <Form.Submit asChild>
                            <button className="btn primary mt-5" type="submit">
                                Change Password
                            </button>
                        </Form.Submit>
                    </div>

                    {props.validationErrors &&
                        Object.values(props.validationErrors).map((v) => (
                            <div
                                key={v}
                                className="mt-5 field-message animate-in slide-in-from-bottom fade-in-50 duration-300"
                            >
                                {v}
                            </div>
                        ))}
                </Form.Root>
            </div>
        </div>
    )
}
