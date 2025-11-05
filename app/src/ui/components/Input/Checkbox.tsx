import clsx from "clsx"
import React, { useCallback } from "react"

import { CheckIcon } from "@/ui/components/Icons"

export interface CheckboxProps
    extends Omit<React.ButtonHTMLAttributes<HTMLInputElement>, "onChange" | "type" | "value"> {
    ref?: React.Ref<HTMLLabelElement>
    indicatorClassName?: string
    label: string
    value?: boolean
    onChange?: (checked: boolean | "indeterminate") => void
}

export function Checkbox(props: CheckboxProps) {
    let { className, indicatorClassName, ref, onChange, value, ...intrinsics } = props

    let onChangeInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange?.(e.target.checked)
        },
        [onChange],
    )

    return (
        <label className={clsx("checkbox-field", className)} ref={ref}>
            <span className="sr-only">
                <input
                    tabIndex={0}
                    type="checkbox"
                    checked={value}
                    onChange={onChangeInput}
                    {...intrinsics}
                />
            </span>

            {props.label}

            <div className={clsx("checkbox", indicatorClassName)} aria-hidden="true">
                <CheckIcon />
            </div>
        </label>
    )
}
