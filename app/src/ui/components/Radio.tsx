import clsx from "clsx"
import React, { useContext, useId } from "react"

import { radioGroupContext } from "./context"
import { useRadioGroup } from "./useRadioGroup"

export type RadioGroupProps = Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "onKeyDown" | "onFocus"
> & {
    value?: string
    onValueChange?: (value: string) => void
}

export function RadioGroup({ value, onValueChange, ...props }: RadioGroupProps) {
    let { ref, selected, focussed, onKeyDown, onFocus, onChange } = useRadioGroup({
        defaultValue: value,
        onValueChange,
    })
    let id = useId()

    return (
        <radioGroupContext.Provider
            value={{
                selected,
                focussed,
                onChange,
            }}
        >
            <div
                {...props}
                ref={ref}
                onKeyDown={onKeyDown}
                onFocus={onFocus}
                className={clsx("radio-group", props.className)}
                role="radiogroup"
                id={id}
            />
        </radioGroupContext.Provider>
    )
}

export interface RadioItemProps {
    className?: string
    label: string
    disabled?: boolean
    readOnly?: boolean
    required?: boolean
    value: string
}

export function RadioItem(props: RadioItemProps) {
    let ctx = useContext(radioGroupContext)

    let selected = ctx?.selected === props.value

    return (
        <label className={clsx("radio-item", props.className)} htmlFor={props.value}>
            <div className="radio-indicator" />
            {props.label}
            <input
                onChange={ctx?.onChange}
                type="radio"
                value={props.value}
                disabled={props.disabled}
                readOnly={props.readOnly}
                id={props.value}
                required={props.required}
                checked={selected}
                tabIndex={selected ? 0 : -1}
            />
        </label>
    )
}
