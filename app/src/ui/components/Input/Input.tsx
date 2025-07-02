import * as Form from "@radix-ui/react-form"
import clsx from "clsx"
import React from "react"

import { AsteriskIcon } from "@/ui/components/Icons"

export interface InputProps {
    className?: string
    labelClassName?: string
    inputClassName?: string
    inputWrapperClassName?: string
    descriptionClassName?: string
    iconClassName?: string
    messageClassName?: string
    size?: "sm" | "md"

    label?: string
    ariaLabel?: string
    name: string
    description?: string
    type?: "text" | "password" | "search" | "email"
    placeholder?: string
    icon?: React.ReactNode
    autoComplete?: string
    autoFocus?: boolean
    required?: boolean
    disabled?: boolean
    readOnly?: boolean

    serverInvalid?: boolean
    message?: string
    messages?: Record<string, string | ((data: { name: string }) => string)>

    value?: any
    onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    defaultValue?: string
}

export function Input(props: InputProps) {
    let size = props.size ?? "md"
    let autocomplete = props.autoComplete ?? "disabled"

    return (
        <Form.Field
            name={props.name}
            aria-label={props.ariaLabel}
            className={clsx("input-field", props.className)}
            serverInvalid={props.serverInvalid}
        >
            {props.label && (
                <Form.Label htmlFor={props.name} className={props.labelClassName}>
                    {props.label}
                    {props.required && <AsteriskIcon className="required-icon" />}
                </Form.Label>
            )}
            <div className={clsx("relative", props.inputWrapperClassName)}>
                {props.icon && (
                    <span className={clsx("icon", props.iconClassName)}>{props.icon}</span>
                )}
                <Form.Control asChild>
                    <input
                        type={props.type ?? "text"}
                        name={props.name}
                        id={props.name}
                        className={clsx(
                            "input",
                            {
                                "pl-8": props.icon,
                                "py-2 px-2": size === "md",
                                "py-1 px-1": size === "sm",
                            },
                            props.inputClassName,
                        )}
                        placeholder={props.placeholder}
                        autoComplete={autocomplete}
                        // biome-ignore lint/a11y/noAutofocus: controlled by prop
                        autoFocus={props.autoFocus}
                        required={props.required}
                        disabled={props.disabled}
                        onKeyUp={props.onKeyUp}
                        onChange={props.onChange}
                        value={props.value}
                        readOnly={props.readOnly}
                        defaultValue={props.defaultValue}
                    />
                </Form.Control>
            </div>

            {props.messages && (
                <Form.Message match="valueMissing" asChild>
                    <div className={clsx("mt-2 field-message", props.messageClassName)}>
                        {translate("Invalid/Empty", props.messages, {
                            name: props.label ?? props.name,
                        })}
                    </div>
                </Form.Message>
            )}

            {props.message && (
                <Form.Message asChild>
                    <div className={clsx("mt-2 field-message", props.messageClassName)}>
                        {translate(props.message, props.messages, {
                            name: props.label ?? props.name,
                        })}
                    </div>
                </Form.Message>
            )}

            {props.description && (
                <small className={clsx("description", props.descriptionClassName)}>
                    {props.description}
                </small>
            )}
        </Form.Field>
    )
}

function translate(key: string, messages: InputProps["messages"], data: { name: string }): string {
    let message = messages?.[key]
    if (!message) {
        return key
    }

    if (typeof message === "function") {
        return message(data)
    }

    return message
}
