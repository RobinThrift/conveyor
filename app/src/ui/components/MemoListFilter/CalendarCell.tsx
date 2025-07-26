import React, { useContext, useRef } from "react"
import { mergeProps, useCalendarCell, useFocusRing, useHover, usePress } from "react-aria"
import {
    type CalendarCellProps as AriaCalendarCellProps,
    CalendarStateContext as AriaCalendarStateContext,
} from "react-aria-components"

import { isSameDay, isSameMonth } from "@/lib/i18n"

export function CalendarCell({
    date,
    ref,
    ...otherProps
}: AriaCalendarCellProps & { ref?: React.Ref<HTMLTableDataCellElement> }) {
    let state = useContext(AriaCalendarStateContext)
    let buttonRef = useRef<HTMLDivElement>(null)
    let { cellProps, buttonProps, ...states } = useCalendarCell(
        { date },
        // biome-ignore lint/style/noNonNullAssertion: state should never be null
        state!,
        buttonRef,
    )

    let isDisabled = states.isDisabled
    // biome-ignore lint/style/noNonNullAssertion: state should never be null
    let isOutsideMonth = !isSameMonth(state!.focusedDate, date)
    if (state?.maxValue) {
        isDisabled = date.compare(state.maxValue) > 0
    }

    let { hoverProps, isHovered } = useHover({
        ...otherProps,
        isDisabled,
    })
    let { focusProps, isFocusVisible } = useFocusRing()
    isFocusVisible &&= states.isFocused

    let value = state?.value

    let { pressProps, isPressed } = usePress({
        shouldCancelOnPointerExit: true,
        isDisabled,
        preventFocusOnPress: false,
        ref: buttonRef,
        onPress() {
            if (state?.isSelected(date) && value && isSameDay(value, date)) {
                state?.selectDate(null as any)
            } else {
                state?.selectDate(date)
            }
            state?.setFocusedDate(date)
        },
    })

    let dataAttrs = {
        "data-focused": states.isFocused || undefined,
        "data-hovered": isHovered || undefined,
        "data-pressed": isPressed || undefined,
        "data-disabled": isDisabled || undefined,
        "data-focus-visible": isFocusVisible || undefined,
        "data-outside-visible-range": states.isOutsideVisibleRange || undefined,
        "data-outside-month": isOutsideMonth || undefined,
        "data-selected": states.isSelected || undefined,
    }

    let {
        // biome-ignore lint/correctness/noUnusedVariables: is discarded
        onClick,
        // biome-ignore lint/correctness/noUnusedVariables: is discarded
        onKeyDown,
        // biome-ignore lint/correctness/noUnusedVariables: is discarded
        onDragStart,
        // biome-ignore lint/correctness/noUnusedVariables: is discarded
        onFocus,
        // biome-ignore lint/correctness/noUnusedVariables: is discarded
        onMouseDown,
        // biome-ignore lint/correctness/noUnusedVariables: is discarded
        onPointerDown,
        // biome-ignore lint/correctness/noUnusedVariables: is discarded
        onPointerEnter,
        // biome-ignore lint/correctness/noUnusedVariables: is discarded
        onPointerLeave,
        // biome-ignore lint/correctness/noUnusedVariables: is discarded
        onPointerUp,
        ...restButtonProps
    } = buttonProps

    return (
        <td {...cellProps} ref={ref}>
            <div
                {...mergeProps(
                    otherProps,
                    restButtonProps,
                    pressProps,
                    focusProps,
                    hoverProps,
                    dataAttrs,
                )}
                ref={buttonRef}
            >
                <span>{states.formattedDate}</span>
            </div>
        </td>
    )
}
