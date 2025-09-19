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

    label?: string
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

    message?: string
    messages?: Record<string, string | ((data: { name: string }) => string)>

    value?: any
    onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    defaultValue?: string
}

export function Input(props: InputProps) {
    let autocomplete = props.autoComplete ?? "disabled"

    return (
        <div className={clsx("input-field", props.className)}>
            {props.label && (
                <label htmlFor={props.name} className={props.labelClassName}>
                    {props.label}
                    {props.required && <AsteriskIcon className="required-icon" />}
                </label>
            )}
            <div className={clsx("relative", props.inputWrapperClassName)}>
                {props.icon && (
                    <span className={clsx("icon", props.iconClassName)}>{props.icon}</span>
                )}
                <input
                    type={props.type ?? "text"}
                    name={props.name}
                    id={props.name}
                    className={clsx(
                        "input",
                        {
                            "has-icon": props.icon,
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
            </div>

            {props.message && (
                <div className={clsx("mt-2 field-message", props.messageClassName)}>
                    {translate(props.message, props.messages, {
                        name: props.label ?? props.name,
                    })}
                </div>
            )}

            {props.description && (
                <small className={clsx("description", props.descriptionClassName)}>
                    {props.description}
                </small>
            )}
        </div>
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
