import clsx from "clsx"
import React, { useCallback } from "react"

import { CaretDownIcon } from "@/ui/components/Icons"

export interface SelectProps<T extends string = string> {
    className?: string
    fieldClassName?: string
    wrapperClassName?: string
    labelClassName?: string
    label?: string
    name: string
    value?: T
    placeholder?: string
    isDisabled?: boolean
    children:
        | React.ReactElement<SelectOptionProps>
        | React.ReactElement<SelectOptionProps>[]
    onChange: (value?: T) => void
}

export function Select<T extends string = string>(props: SelectProps<T>) {
    let onChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            props.onChange(e.target.value as T)
        },
        [props.onChange],
    )

    return (
        <div className={clsx("select-field", props.fieldClassName)}>
            {props.label && (
                <label
                    className={clsx("select-label", props.labelClassName)}
                    htmlFor={props.name}
                >
                    {props.label}
                </label>
            )}

            <div className={clsx("select-wrapper", props.wrapperClassName)}>
                <select
                    name={props.name}
                    id={props.name}
                    disabled={props.isDisabled}
                    onChange={onChange}
                    className={clsx("select", props.className)}
                    value={props.value}
                >
                    {props.children}
                </select>

                <CaretDownIcon className="select-arrow" />
            </div>
        </div>
    )
}

Select.Group = OptionGroup
Select.Option = Option

export interface SelectOptionGroupProps {
    children: React.ReactNode | React.ReactNode[]
    label: string
}

export function OptionGroup(props: SelectOptionGroupProps) {
    return (
        <optgroup className="select-group" label={props.label}>
            {props.children}
        </optgroup>
    )
}

export interface SelectOptionProps<T extends string = string> {
    className?: string
    value: T
    isDisabled?: boolean
    children: React.ReactNode | React.ReactNode[]
}

export function Option(props: SelectOptionProps) {
    return (
        <option
            className={clsx("select-item", props.className)}
            disabled={props.isDisabled}
            value={props.value}
        >
            {props.children}
        </option>
    )
}
