import { Check } from "@phosphor-icons/react"
import * as RadixCheckbox from "@radix-ui/react-checkbox"
import clsx from "clsx"
import React from "react"

export interface CheckboxProps {
    className?: string
    labelClassName?: string
    indicatorClassName?: string
    label: string
    name: string
    defaultChecked?: boolean
    value?: boolean
    onChange?: (checked: boolean | "indeterminate") => void
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
    function Checkbox(props, forwardedRef) {
        return (
            <div className={clsx("checkbox-field", props.className)}>
                <RadixCheckbox.Root
                    ref={forwardedRef}
                    className={clsx("checkbox", props.indicatorClassName)}
                    id={props.name}
                    name={props.name}
                    defaultChecked={props.defaultChecked}
                    onCheckedChange={props.onChange}
                    checked={props.value}
                >
                    <RadixCheckbox.Indicator className="text-primary">
                        <Check weight="bold" />
                    </RadixCheckbox.Indicator>
                </RadixCheckbox.Root>
                <label htmlFor={props.name} className={props.labelClassName}>
                    {props.label}
                </label>
            </div>
        )
    },
)
