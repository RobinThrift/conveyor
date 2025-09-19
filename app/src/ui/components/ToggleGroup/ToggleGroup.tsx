import clsx from "clsx"
import React, { useContext, useId } from "react"

import { toggleGroupContext } from "./context"
import { useToggleGroup } from "./useToggleGroup"

export type ToggleGroupProps = Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "onKeyDown" | "onFocus"
> & {
    value?: string
    onValueChange?: (value?: string) => void
    orientation?: "horizontal" | "vertical"
}

export function ToggleGroup({ value, onValueChange, orientation, ...props }: ToggleGroupProps) {
    let { ref, selected, focussed, onKeyDown, onFocus, setValue } = useToggleGroup({
        defaultValue: value,
        onValueChange,
    })
    let id = useId()

    return (
        <toggleGroupContext.Provider
            value={{
                selected,
                focussed,
                setValue,
            }}
        >
            <div
                {...props}
                ref={ref}
                className={clsx("toggle-group", props.className)}
                onKeyDown={onKeyDown}
                onFocus={onFocus}
                role="radiogroup"
                aria-orientation={orientation ?? "horizontal"}
                id={id}
            />
        </toggleGroupContext.Provider>
    )
}

export interface ToggleButtonProps {
    className?: string
    disabled?: boolean
    value: string
}

export function ToggleButton(props: React.PropsWithChildren<ToggleButtonProps>) {
    let ctx = useContext(toggleGroupContext)

    let selected = ctx?.selected === props.value
    let focussed = ctx?.focussed === props.value

    return (
        //biome-ignore lint/a11y/useSemanticElements: this is correct according to the guidelines
        <button
            type="button"
            className={clsx("toggle-button", props.className)}
            role="radio"
            aria-checked={selected}
            tabIndex={focussed ? 0 : -1}
            id={props.value}
            onClick={() => {
                if (selected) {
                    ctx?.setValue(undefined)
                } else {
                    ctx?.setValue(props.value)
                }
            }}
        >
            {props.children}
        </button>
    )
}
