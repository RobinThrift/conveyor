import { CaretDown, CaretUp, Check } from "@phosphor-icons/react"
import * as RadixSelect from "@radix-ui/react-select"
import clsx from "clsx"
import React, { useCallback } from "react"

export interface SelectProps<T extends string = string> {
    className?: string
    ariaLabel: string
    name: string
    value?: T
    placeholder?: string
    children:
        | React.ReactElement<SelectOptionProps>
        | React.ReactElement<SelectOptionProps>[]
    onChange: (value: T) => void
}

export function Select<T extends string = string>(props: SelectProps<T>) {
    let onValueChange = useCallback(
        (value: T) => {
            props.onChange(value as T)
        },
        [props.onChange],
    )

    return (
        <RadixSelect.Root
            name={props.name}
            onValueChange={onValueChange}
            value={props.value}
        >
            <RadixSelect.Trigger
                className={clsx(
                    "input flex items-center gap-2 justify-between px-2 py-1 text-sm bg-surface text-body-contrast",
                    props.className,
                )}
                aria-label={props.ariaLabel}
            >
                <RadixSelect.Value placeholder={props.placeholder} />
                <span aria-hidden="true">
                    <CaretDown />
                </span>
            </RadixSelect.Trigger>

            <RadixSelect.Portal>
                <RadixSelect.Content className="select-list">
                    <RadixSelect.ScrollUpButton className="flex py-2 cursor-default items-center justify-center bg-surface text-primary">
                        <CaretUp />
                    </RadixSelect.ScrollUpButton>

                    <RadixSelect.Viewport className="select-list-viewport">
                        {props.children}
                    </RadixSelect.Viewport>

                    <RadixSelect.ScrollDownButton className="flex py-2 cursor-default items-center justify-center bg-surface text-primary">
                        <CaretDown />
                    </RadixSelect.ScrollDownButton>
                </RadixSelect.Content>
            </RadixSelect.Portal>
        </RadixSelect.Root>
    )
}

export interface SelectOptionGroupProps {
    children: React.ReactNode | React.ReactNode[]
    label: string
}

export function OptionGroup(props: SelectOptionGroupProps) {
    return (
        <RadixSelect.Group className="select-group">
            <RadixSelect.Label>{props.label}</RadixSelect.Label>

            {props.children}
        </RadixSelect.Group>
    )
}

export interface SelectOptionProps<T extends string = string> {
    children: React.ReactNode | React.ReactNode[]
    value: T
    disabled?: boolean
    useCheckbox?: boolean
}

export const Option = React.forwardRef<HTMLDivElement, SelectOptionProps>(
    function Option(props, forwardedRef) {
        return (
            <RadixSelect.SelectItem
                className={clsx("select-item", {
                    nocheckbox: !props.useCheckbox,
                    "checkbox-item": props.useCheckbox,
                })}
                value={props.value}
                disabled={props.disabled}
                ref={forwardedRef}
            >
                <RadixSelect.ItemText>{props.children}</RadixSelect.ItemText>
                {props.useCheckbox && (
                    <RadixSelect.ItemIndicator className="absolute left-1 mt-0.5 inline-flex items-center justify-center text-primary">
                        <Check weight="bold" size={14} />
                    </RadixSelect.ItemIndicator>
                )}
            </RadixSelect.SelectItem>
        )
    },
)

Select.Group = OptionGroup
Select.Option = Option
