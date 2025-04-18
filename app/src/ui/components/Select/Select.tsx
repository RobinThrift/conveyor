import clsx from "clsx"
import React, { useCallback } from "react"
import {
    Button as AriaButton,
    Header as AriaHeader,
    Label as AriaLabel,
    ListBox as AriaListBox,
    ListBoxItem as AriaListBoxItem,
    ListBoxSection as AriaListBoxSection,
    Popover as AriaPopover,
    Select as AriaSelect,
    SelectValue as AriaSelectValue,
    type Key,
} from "react-aria-components"

import { CaretDownIcon } from "@/ui/components/Icons"

export interface SelectProps<T extends string = string> {
    className?: string
    labelClassName?: string
    buttonClassName?: string
    label?: string
    name: string
    value?: T
    placeholder?: string
    isDisabled?: boolean
    children:
        | React.ReactElement<SelectOptionProps>
        | React.ReactElement<SelectOptionProps>[]
    onChange: (value: T) => void
}

export function Select<T extends string = string>(props: SelectProps<T>) {
    let onSelectionChange = useCallback(
        (value: Key) => {
            props.onChange(value as T)
        },
        [props.onChange],
    )

    return (
        <AriaSelect
            name={props.name}
            onSelectionChange={onSelectionChange}
            defaultSelectedKey={props.value}
            isDisabled={props.isDisabled}
            placeholder={props.placeholder}
            className={props.className}
        >
            {props.label && (
                <AriaLabel
                    className={clsx("select-label", props.labelClassName)}
                >
                    {props.label}
                </AriaLabel>
            )}
            <AriaButton
                className={clsx(
                    "select-input",
                    props.buttonClassName ?? "input",
                )}
            >
                <AriaSelectValue />
                <span aria-hidden="true">
                    <CaretDownIcon />
                </span>
            </AriaButton>

            <AriaPopover>
                <AriaListBox className="select-list">
                    {props.children}
                </AriaListBox>
            </AriaPopover>
        </AriaSelect>
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
        <AriaListBoxSection className="select-group">
            <AriaHeader>{props.label}</AriaHeader>
            {props.children}
        </AriaListBoxSection>
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
        <AriaListBoxItem
            id={props.value}
            className={clsx("select-item", props.className)}
            textValue={props.value}
            isDisabled={props.isDisabled}
        >
            {props.children}
        </AriaListBoxItem>
    )
}
