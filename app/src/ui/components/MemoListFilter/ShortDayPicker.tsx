import clsx from "clsx"
import React, { useCallback, useRef, useState, useEffect, useMemo } from "react"
import {
    Calendar as AriaCalendar,
    CalendarGrid as AriaCalendarGrid,
    CalendarGridBody as AriaCalendarGridBody,
    CalendarGridHeader as AriaCalendarGridHeader,
    CalendarHeaderCell as AriaCalendarHeaderCell,
    Heading as AriaHeading,
    type DateValue,
} from "react-aria-components"

import { type CalendarDate, currentDateTime, isSameDay } from "@/lib/i18n"

import { CalendarCell } from "./CalendarCell"

export interface ShortDayPickerProps {
    className?: string
    selected?: CalendarDate
    onSelect: (date?: CalendarDate) => void
}

export function ShortDayPicker(props: ShortDayPickerProps) {
    let scrollToRef = useRef<HTMLTableCellElement | null>(null)
    let [focusedDate, setFocusedDate] = useState<CalendarDate>(
        props.selected ?? currentDateTime(),
    )

    let today = useMemo(() => {
        return currentDateTime()
    }, [])

    let onChange = useCallback(
        (value: DateValue) => {
            props.onSelect(value as CalendarDate)
        },
        [props.onSelect],
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: we need to rerender when the ref changes
    useEffect(() => {
        if (scrollToRef.current) {
            scrollToRef.current.parentElement?.parentElement?.scrollTo({
                left: scrollToRef.current.parentElement?.offsetLeft,
                behavior: "instant",
            })
        }
    }, [scrollToRef.current])

    return (
        <AriaCalendar
            aria-label="Appointment date"
            maxValue={today}
            firstDayOfWeek="mon"
            visibleDuration={{ months: 1 }}
            focusedValue={focusedDate}
            onChange={onChange}
            onFocusChange={setFocusedDate}
            value={props.selected ?? null}
            className={clsx("short-day-picker", props.className)}
        >
            <header className="sr-only">
                <AriaHeading />
            </header>
            <AriaCalendarGrid className="calendar-grid">
                <AriaCalendarGridHeader className="calendar-grid-header">
                    {(day) => (
                        <AriaCalendarHeaderCell className="calendar-grid-cell">
                            {day}
                        </AriaCalendarHeaderCell>
                    )}
                </AriaCalendarGridHeader>
                <AriaCalendarGridBody className="calendar-grid-body">
                    {(date) => {
                        let setScrollRef =
                            (!props.selected && isSameDay(today, date)) ||
                            (props.selected && isSameDay(props.selected, date))
                        return (
                            <CalendarCell
                                ref={setScrollRef ? scrollToRef : undefined}
                                className={clsx("calendar-grid-cell", {
                                    today: isSameDay(today, date),
                                })}
                                date={date}
                            />
                        )
                    }}
                </AriaCalendarGridBody>
            </AriaCalendarGrid>
        </AriaCalendar>
    )
}
