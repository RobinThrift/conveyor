import { useStore } from "@tanstack/react-store"
import clsx from "clsx"
import React, { useCallback, useMemo, useState } from "react"
import {
    Calendar as AriaCalendar,
    CalendarGrid as AriaCalendarGrid,
    CalendarGridBody as AriaCalendarGridBody,
    CalendarGridHeader as AriaCalendarGridHeader,
    CalendarHeaderCell as AriaCalendarHeaderCell,
    type DateValue,
} from "react-aria-components"

import { type CalendarDate, currentDate, getLocalTimeZone, isSameDay } from "@/lib/i18n"
import { Button } from "@/ui/components/Button"
import { CaretLeftIcon, CaretRightIcon } from "@/ui/components/Icons"
import { useFormat, useT } from "@/ui/i18n"
import { actions, selectors, stores } from "@/ui/stores"

import { CalendarCell } from "./CalendarCell"

export interface DatePickerProps {
    className?: string
}

export const DatePicker = React.memo(function DatePicker({ className }: DatePickerProps) {
    let t = useT("components/MemoListFilter/DatePicker")
    let exactDateFilter = useStore(
        stores.memos.list.filter,
        selectors.memos.list.filter("exactDate"),
    )
    let [focusedDate, setFocusedDate] = useState<CalendarDate>(exactDateFilter ?? currentDate())

    let onClickTodayBtn = useCallback(() => {
        setFocusedDate(currentDate())
    }, [])

    let today = useMemo(() => {
        return currentDate()
    }, [])

    let onChange = useCallback((value: DateValue) => {
        actions.memos.list.setFilter({ exactDate: (value as CalendarDate) || undefined })
    }, [])

    return (
        <div className={clsx("date-picker", className)}>
            <AriaCalendar
                aria-label="Appointment date"
                maxValue={today}
                firstDayOfWeek="mon"
                visibleDuration={{ months: 1 }}
                focusedValue={focusedDate}
                onChange={onChange}
                onFocusChange={setFocusedDate}
                value={exactDateFilter ?? null}
                className="date-picker-calendar"
            >
                <div className="date-picker-header">
                    <Button iconLeft={<CaretLeftIcon />} plain={true} slot="previous" />
                    <div className="date-picker-dropdowns">
                        <MonthDropdown
                            currentMonth={focusedDate}
                            setMonth={setFocusedDate}
                            maxValue={today}
                        />
                        <YearDropdown
                            currentYear={focusedDate}
                            setYear={setFocusedDate}
                            maxValue={today}
                        />
                    </div>
                    <Button iconLeft={<CaretRightIcon />} plain={true} slot="next" />
                </div>
                <AriaCalendarGrid className="calendar-grid">
                    <AriaCalendarGridHeader className="calendar-grid-header">
                        {(day) => (
                            <AriaCalendarHeaderCell className="calendar-grid-cell">
                                {day}
                            </AriaCalendarHeaderCell>
                        )}
                    </AriaCalendarGridHeader>
                    <AriaCalendarGridBody className="calendar-grid-body">
                        {(date) => (
                            <CalendarCell
                                className={clsx("calendar-grid-cell", {
                                    today: isSameDay(today, date),
                                })}
                                date={date}
                            />
                        )}
                    </AriaCalendarGridBody>
                </AriaCalendarGrid>
            </AriaCalendar>

            <div className="mt-2 flex justify-end">
                <Button size="sm" variant="primary" outline={true} onPress={onClickTodayBtn}>
                    {t.Today}
                </Button>
            </div>
        </div>
    )
})

function MonthDropdown({
    currentMonth,
    maxValue,
    setMonth,
}: {
    currentMonth: CalendarDate
    maxValue: CalendarDate
    setMonth: (m: CalendarDate) => void
}) {
    let { formatDateTime } = useFormat()

    let months = useMemo(() => {
        let months: { value: number; label: string; isDisabled: boolean }[] = []
        let numMonths = currentMonth.calendar.getMonthsInYear(currentMonth)
        for (let i = 1; i <= numMonths; i++) {
            let date = currentMonth.set({ month: i })
            months.push({
                value: i,
                label: formatDateTime(date.toDate(getLocalTimeZone()), {
                    month: "long",
                }),
                isDisabled: maxValue.compare(date) < 0,
            })
        }

        return months
    }, [currentMonth, formatDateTime, maxValue.compare])

    let onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        let value = Number(e.target.value)
        let nextMonth = currentMonth.set({ month: value })
        setMonth(nextMonth)
    }

    return (
        <select aria-label="Month" name="month" onChange={onChange} value={currentMonth.month}>
            {months.map((month) => (
                <option key={month.value} value={month.value} disabled={month.isDisabled}>
                    {month.label}
                </option>
            ))}
        </select>
    )
}

function YearDropdown({
    currentYear,
    maxValue,
    setYear,
}: {
    currentYear: CalendarDate
    maxValue: CalendarDate
    setYear: (m: CalendarDate) => void
}) {
    let { formatDateTime } = useFormat()

    let years = useMemo(() => {
        let years = []
        for (let i = -20; i <= 20; i++) {
            let date = currentYear.add({ years: i })
            if (date.year > maxValue.year) {
                break
            }
            years.push({
                value: date,
                formatted: formatDateTime(date.toDate(getLocalTimeZone()), {
                    year: "numeric",
                }),
            })
        }
        return years
    }, [formatDateTime, currentYear.add, maxValue.year])

    let onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        let index = Number(e.target.value)
        let selctedYear = years[index].value
        setYear(selctedYear)
    }

    return (
        <select aria-label="Year" name="year" onChange={onChange}>
            {years.map((year, i) => (
                <option key={year.formatted} value={i}>
                    {year.formatted}
                </option>
            ))}
        </select>
    )
}
