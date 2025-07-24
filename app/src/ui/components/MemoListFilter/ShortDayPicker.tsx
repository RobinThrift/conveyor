import { useStore } from "@tanstack/react-store"
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

import { type CalendarDate, currentDate, isSameDay } from "@/lib/i18n"
import { actions, selectors, stores } from "@/ui/stores"

import { CalendarCell } from "./CalendarCell"

export interface ShortDayPickerProps {
    className?: string
}

export const ShortDayPicker = React.memo(function ShortDayPicker(props: ShortDayPickerProps) {
    let scrollToRef = useRef<HTMLTableCellElement | null>(null)
    let exactDateFilter = useStore(
        stores.memos.list.filter,
        selectors.memos.list.filter("exactDate"),
    )
    let [focusedDate, setFocusedDate] = useState<CalendarDate>(exactDateFilter ?? currentDate())

    let today = useMemo(() => {
        return currentDate()
    }, [])

    let onChange = useCallback((value: DateValue) => {
        actions.memos.list.setFilter({ exactDate: (value as CalendarDate) || undefined })
    }, [])

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
            value={exactDateFilter ?? null}
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
                            (!exactDateFilter && isSameDay(today, date)) ||
                            (exactDateFilter && isSameDay(exactDateFilter, date))
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
})
