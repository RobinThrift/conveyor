import { Radio as RadixRadio } from "@base-ui-components/react/radio"
import { RadioGroup as RadixRadioGroup } from "@base-ui-components/react/radio-group"
import clsx from "clsx"
import React from "react"

export type RadioGroupProps = RadixRadioGroup.Props

export function RadioGroup(props: RadioGroupProps) {
    return (
        <RadixRadioGroup
            {...props}
            className={clsx("radio-group", props.className)}
        />
    )
}

export interface RadioItemProps {
    className?: string
    label: string
    disabled?: boolean
    readOnly?: boolean
    required?: boolean
    name?: string
    value?: unknown
}

export function RadioItem(props: RadioItemProps) {
    return (
        <label
            className={clsx("radio-item", props.className)}
            htmlFor={props.name}
        >
            <RadixRadio.Root
                value={props.value}
                disabled={props.disabled}
                readOnly={props.readOnly}
                name={props.name}
                required={props.required}
            >
                <RadixRadio.Indicator className="radio-indicator" />
            </RadixRadio.Root>
            {props.label}
        </label>
    )
}
