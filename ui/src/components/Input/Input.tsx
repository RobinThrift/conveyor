import { Asterisk } from "@phosphor-icons/react"
import * as Form from "@radix-ui/react-form"
import clsx from "clsx"
import React from "react"

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

    serverInvalid?: boolean
    message?: string

    value?: any
    onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
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
                <Form.Label
                    htmlFor={props.name}
                    className={props.labelClassName}
                >
                    {props.label}
                    {props.required && <Asterisk className="required-icon" />}
                </Form.Label>
            )}
            <div className={clsx("relative", props.inputWrapperClassName)}>
                {props.icon && (
                    <span className={clsx("icon", props.iconClassName)}>
                        {props.icon}
                    </span>
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
                        required={props.required}
                        disabled={props.disabled}
                        onKeyUp={props.onKeyUp}
                        onChange={props.onChange}
                        value={props.value}
                    />
                </Form.Control>
            </div>

            {props.serverInvalid && props.message && (
                <Form.Message
                    className={clsx(
                        "mt-2 field-message",
                        props.messageClassName,
                    )}
                >
                    {props.message}
                </Form.Message>
            )}

            {props.description && (
                <small
                    className={clsx("description", props.descriptionClassName)}
                >
                    {props.description}
                </small>
            )}
        </Form.Field>
    )
}
