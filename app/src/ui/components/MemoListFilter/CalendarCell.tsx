import React, { useContext, useRef } from "react"
import {
    useCalendarCell,
    mergeProps,
    useHover,
    useFocusRing,
    usePress,
} from "react-aria"
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
        state!,
        buttonRef,
    )

    let isDisabled = states.isDisabled
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
        onClick,
        onKeyDown,
        onDragStart,
        onFocus,
        onMouseDown,
        onPointerDown,
        onPointerEnter,
        onPointerLeave,
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
                {states.formattedDate}
            </div>
        </td>
    )
}
