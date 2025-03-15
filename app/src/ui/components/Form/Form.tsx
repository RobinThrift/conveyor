import React, { useMemo } from "react"

import * as RadixForm from "@radix-ui/react-form"
import clsx from "clsx"

export function Form(props: RadixForm.FormProps) {
    return (
        <RadixForm.Root {...props} className={clsx("form", props.className)} />
    )
}

Form.Message = FormMessage

export interface FormMessageProps {
    className?: string
    error?: Error
    messages?: Record<string, string | ((data: any) => string)>
    children?: React.ReactNode | React.ReactNode[]
}

export function FormMessage(props: FormMessageProps) {
    let children = useMemo(() => {
        if (!props.error) {
            return props.children
        }

        let c = React.Children.toArray(props.children)

        if (!props.messages) {
            c.push(`${props.error.name}: ${props.error.message}`)
            return c
        }

        let key = props.error.name
        if ("title" in props.error) {
            key = props.error.title as string
        }

        if (key in props.messages && typeof props.messages[key] === "string") {
            c.push(props.messages[key] as string)
        }

        return c
    }, [props.error, props.children, props.messages])

    return (
        <div className={clsx("form-message", props.className)}>{children}</div>
    )
}
