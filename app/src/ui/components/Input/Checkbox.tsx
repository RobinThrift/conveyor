import clsx from "clsx"
import React from "react"
import { Checkbox as AriaCheckbox } from "react-aria-components"

import { CheckIcon } from "@/ui/components/Icons"

export interface CheckboxProps {
    ref?: React.Ref<HTMLLabelElement>
    className?: string
    indicatorClassName?: string
    label: string
    name: string
    defaultChecked?: boolean
    value?: boolean
    isDisabled?: boolean
    onChange?: (checked: boolean | "indeterminate") => void
}

export function Checkbox(props: CheckboxProps) {
    return (
        <AriaCheckbox
            ref={props.ref}
            id={props.name}
            name={props.name}
            defaultSelected={props.defaultChecked}
            onChange={props.onChange}
            isSelected={props.value}
            isDisabled={props.isDisabled}
            value={props.value?.toString()}
            className={clsx("checkbox-field", props.className)}
        >
            {props.label}

            <div className={clsx("checkbox", props.indicatorClassName)}>
                <CheckIcon weight="bold" />
            </div>
        </AriaCheckbox>
    )
}
