/** biome-ignore-all lint/a11y/useFocusableInteractive: too many false positives despite following best practices */
/** biome-ignore-all lint/a11y/useSemanticElements: same as above */
import { useStore } from "@tanstack/react-store"
import clsx from "clsx"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Temporal } from "temporal-polyfill"

import { currentDate, isSameMonthOfYear } from "@/lib/i18n"
import { Button } from "@/ui/components/Button"
import { CaretDownIcon, CaretLeftIcon, CaretRightIcon } from "@/ui/components/Icons"
import { useTimedMemo } from "@/ui/hooks/useTimedMemo"
import { useFormat, useT, useWeekInfo } from "@/ui/i18n"
import { actions, selectors, stores } from "@/ui/stores"

export interface DatePickerProps {
    className?: string
}

export const DatePicker = React.memo(function DatePicker({ className }: DatePickerProps) {
    let t = useT("components/MemoListFilter/DatePicker")
    let { formatDateTime } = useFormat()
    let {
        selectedDate,
        setSelectedDate,
        showingMonth,
        updateShowingMonth,
        today,
        focussed,
        minValue,
        weekdays,
        rows,
        focusRelative,
        setFocussed,
    } = useDatePicker()
    let [expanded, setExpanded] = useState(false)

    let onClickTodayBtn = useCallback(() => {
        let next = currentDate()
        updateShowingMonth({ month: next.month, year: next.year })
        setFocussed(next)
    }, [updateShowingMonth, setFocussed])

    let toggleExpanded = useCallback(() => {
        setExpanded((c) => !c)
    }, [])

    useEffect(() => {
        if (expanded) {
            return
        }

        if (today === focussed) {
            let el = document.getElementById(`${today.month}-${today.day}`)
            el?.scrollIntoView({ inline: "center", block: "nearest" })
        }
    }, [expanded, today, focussed])

    // biome-ignore lint/style/noNonNullAssertion: can never be not null
    let first = rows.at(0)?.at(0)!
    // biome-ignore lint/style/noNonNullAssertion: can never be not null
    let last = rows.at(-1)?.at(-1)!

    return (
        <div className={clsx("memo-list-date-filter", { compact: !expanded }, className)}>
            <div
                className="memo-list-date-filter-calendar"
                aria-label={t.Label({
                    minValue: formatDateTime(first, { dateStyle: "medium" }),
                    maxValue: formatDateTime(last, { dateStyle: "medium" }),
                    selected: selectedDate
                        ? formatDateTime(selectedDate, { dateStyle: "medium" })
                        : t.NoSelection,
                })}
                aria-expanded={expanded}
                role="application"
            >
                <CalendarHeader
                    minValue={minValue}
                    maxValue={today}
                    showingMonth={showingMonth}
                    updateShowingMonth={updateShowingMonth}
                />

                <div
                    className="memo-list-date-filter-calendar-grid"
                    role="grid"
                    aria-colcount={expanded ? 7 : 7 * 5}
                    aria-rowcount={expanded ? 1 : 5}
                >
                    <div className="memo-list-date-filter-calendar-grid-header" aria-hidden="true">
                        {weekdays.map((weekday) => (
                            <div
                                key={weekday}
                                className="memo-list-date-filter-calendar-grid-header-cell"
                            >
                                {weekday.at(0)}
                            </div>
                        ))}
                    </div>
                    <CalendarGridBody
                        rows={rows}
                        showingMonth={showingMonth}
                        selectedDate={selectedDate}
                        minValue={minValue}
                        maxValue={today}
                        focussed={focussed}
                        onSelectCell={setSelectedDate}
                        onFocuseRelative={focusRelative}
                    />
                </div>

                <div className="memo-list-date-filter-calendar-footer">
                    <Button
                        className="memo-list-date-filter-expand-btn"
                        iconRight={
                            <CaretDownIcon
                                aria-hidden
                                className={clsx({
                                    "rotate-180": expanded,
                                })}
                            />
                        }
                        aria-label={t.Expand}
                        onClick={toggleExpanded}
                    />

                    <Button className="memo-list-date-filter-today-btn" onClick={onClickTodayBtn}>
                        {t.Today}
                    </Button>
                </div>
            </div>
        </div>
    )
})

const CalendarHeader = React.memo(function CalendarHeader({
    maxValue,
    minValue,
    showingMonth,
    updateShowingMonth,
}: {
    showingMonth: Temporal.PlainDate
    minValue: Temporal.PlainDate
    maxValue: Temporal.PlainDate
    updateShowingMonth: (u: { month?: number; year?: number }) => void
}) {
    let t = useT("components/MemoListFilter/DatePicker")

    let onClickNextMonthBtn = useCallback(() => {
        let next = showingMonth.add({ months: 1 })
        if (Temporal.PlainDateTime.compare(next, maxValue) < 1) {
            updateShowingMonth({ month: next.month, year: next.year })
        }
    }, [showingMonth, updateShowingMonth, maxValue])

    let onClickPrevMonthBtn = useCallback(() => {
        let next = showingMonth.subtract({ months: 1 })
        if (Temporal.PlainDateTime.compare(next, minValue) >= 0) {
            updateShowingMonth({ month: next.month, year: next.year })
        }
    }, [showingMonth, updateShowingMonth, minValue])

    return (
        <header className="memo-list-date-filter-calendar-header">
            <div className="memo-list-date-filter-calendar-dropdowns">
                <MonthDropdown
                    currentMonth={showingMonth}
                    setMonth={updateShowingMonth}
                    maxValue={maxValue}
                />
                <YearDropdown
                    currentYear={showingMonth}
                    setYear={updateShowingMonth}
                    maxValue={maxValue}
                    minValue={minValue}
                />
            </div>
            <div className="memo-list-date-filter-calendar-nav-buttons">
                <Button
                    iconLeft={<CaretLeftIcon />}
                    aria-label={t.PreviousMonth}
                    onClick={onClickPrevMonthBtn}
                    disabled={isSameMonthOfYear(minValue, showingMonth)}
                />
                <Button
                    iconLeft={<CaretRightIcon />}
                    aria-label={t.NextMonth}
                    onClick={onClickNextMonthBtn}
                    disabled={isSameMonthOfYear(maxValue, showingMonth)}
                />
            </div>
        </header>
    )
})

const MonthDropdown = React.memo(function MonthDropdown({
    currentMonth,
    maxValue,
    setMonth,
}: {
    currentMonth: Temporal.PlainDate
    maxValue: Temporal.PlainDate
    setMonth: (u: { month: number }) => void
}) {
    let { formatDateTime } = useFormat()
    let t = useT("components/MemoListFilter/DatePicker")

    let months = useMemo(() => {
        let months: { value: number; label: string; isDisabled: boolean }[] = []
        let numMonths = currentMonth.monthsInYear
        for (let i = 1; i <= numMonths; i++) {
            let date = currentMonth.with({ month: i })
            months.push({
                value: i,
                label: formatDateTime(date, { month: "long" }),
                isDisabled: Temporal.PlainDate.compare(maxValue, date) < 0,
            })
        }

        return months
    }, [currentMonth, formatDateTime, maxValue])

    let onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        let value = Number(e.target.value)
        let nextMonth = currentMonth.with({ month: value })
        setMonth({ month: nextMonth.month })
    }

    return (
        <select
            aria-label={t.PickMonth}
            name="month"
            onChange={onChange}
            value={currentMonth.month}
        >
            {months.map((month) => (
                <option key={month.value} value={month.value} disabled={month.isDisabled}>
                    {month.label}
                </option>
            ))}
        </select>
    )
})

const YearDropdown = React.memo(function YearDropdown({
    currentYear,
    maxValue,
    minValue,
    setYear,
}: {
    currentYear: Temporal.PlainDate
    maxValue: Temporal.PlainDate
    minValue: Temporal.PlainDate
    setYear: (u: { year: number }) => void
}) {
    let { formatDateTime } = useFormat()
    let t = useT("components/MemoListFilter/DatePicker")

    let years = useMemo(() => {
        let numYears = maxValue.year - minValue.year
        let years = []
        for (let i = -numYears; i <= numYears; i++) {
            let date = currentYear.add({ years: i })
            if (date.year > maxValue.year) {
                break
            }
            years.push({
                value: date,
                formatted: formatDateTime(date, {
                    year: "numeric",
                }),
            })
        }
        return years
    }, [formatDateTime, currentYear.add, maxValue.year, minValue.year])

    let onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        let value = Number(e.target.value)
        let selctedYear = years.find((y) => y.value.year === value)?.value
        if (selctedYear) {
            setYear({ year: selctedYear.year })
        }
    }

    return (
        <select aria-label={t.PickYear} name="year" onChange={onChange} value={currentYear.year}>
            {years.map((year) => (
                <option key={year.value.year} value={year.value.year}>
                    {year.formatted}
                </option>
            ))}
        </select>
    )
})

const CalendarGridBody = React.memo(function CalendarGridBody({
    rows,
    ...props
}: {
    rows: Temporal.PlainDate[][]
    showingMonth: Temporal.PlainDate
    selectedDate?: Temporal.PlainDate
    focussed: Temporal.PlainDate
    maxValue: Temporal.PlainDate
    minValue: Temporal.PlainDate
    onSelectCell: (d: Temporal.PlainDate) => void
    onFocuseRelative: FocusRelativeFn
}) {
    return (
        <div className="memo-list-date-filter-calendar-grid-body" role="presentation">
            <div className="memo-list-date-filter-calendar-grid-body-cells" role="presentation">
                {rows.map((row) =>
                    row.map((cell) => (
                        <CalendarGridBodyCell
                            key={`${cell.month}-${cell.day}`}
                            date={cell}
                            {...props}
                        />
                    )),
                )}
            </div>
        </div>
    )
})

const CalendarGridBodyCell = React.memo(function CalendarGridBodyCell({
    date,
    showingMonth,
    selectedDate,
    focussed,
    maxValue,
    minValue,
    onSelectCell,
    onFocuseRelative,
}: {
    date: Temporal.PlainDate
    showingMonth: Temporal.PlainDate
    selectedDate?: Temporal.PlainDate
    focussed: Temporal.PlainDate
    maxValue: Temporal.PlainDate
    minValue: Temporal.PlainDate
    onSelectCell: (d: Temporal.PlainDate) => void
    onFocuseRelative: FocusRelativeFn
}) {
    let { formatDateTime } = useFormat()

    let isDisabled =
        Temporal.PlainDate.compare(maxValue, date) < 0 ||
        Temporal.PlainDate.compare(date, minValue) < 0

    let isSelected = selectedDate ? Temporal.PlainDate.compare(date, selectedDate) === 0 : false

    let isFocussed = Temporal.PlainDate.compare(date, focussed) === 0

    let onClick = useCallback(() => {
        if (isDisabled) {
            return
        }
        onSelectCell(date)
    }, [onSelectCell, date, isDisabled])

    let onKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLElement>) => {
            if (isDisabled) {
                return
            }

            switch (e.code) {
                case "ArrowUp":
                    e.preventDefault()
                    e.stopPropagation()
                    onFocuseRelative("up", date)
                    break
                case "ArrowDown":
                    e.preventDefault()
                    e.stopPropagation()
                    onFocuseRelative("down", date)
                    break
                case "ArrowLeft":
                    e.preventDefault()
                    e.stopPropagation()
                    onFocuseRelative("left", date)
                    break
                case "ArrowRight":
                    e.preventDefault()
                    e.stopPropagation()
                    onFocuseRelative("right", date)
                    break
                case "Home":
                    e.preventDefault()
                    e.stopPropagation()
                    onFocuseRelative("home", date)
                    break
                case "End":
                    e.preventDefault()
                    e.stopPropagation()
                    onFocuseRelative("end", date)
                    break
                case "Space":
                case "Enter":
                    e.preventDefault()
                    e.stopPropagation()
                    onSelectCell(date)
                    break
            }
        },
        [onSelectCell, date, isDisabled, onFocuseRelative],
    )

    return (
        <div
            className={clsx("memo-list-date-filter-calendar-grid-body-cell", {
                "is-outside-of-month": !isSameMonthOfYear(showingMonth, date),
                "has-focus": isFocussed,
                today: Temporal.PlainDate.compare(maxValue, date) === 0,
            })}
            role="gridcell"
            aria-disabled={isDisabled && !isSelected}
            aria-selected={isSelected}
        >
            <div
                role="button"
                id={`${date.month}-${date.day}`}
                tabIndex={isFocussed ? 0 : -1}
                aria-label={formatDateTime(date, { dateStyle: "medium" })}
                aria-disabled={isDisabled && !isSelected}
                onClick={onClick}
                onKeyDown={onKeyDown}
            >
                {date.day}
            </div>
        </div>
    )
})

type FocusRelativeFn = (
    dir: "up" | "down" | "left" | "right" | "home" | "end",
    value: Temporal.PlainDate,
) => void

function useDatePicker() {
    let selectedDate = useStore(
        stores.memos.list.filter,
        selectors.memos.list.filter("exactDate"),
        {
            equal: (a, b): boolean => {
                if (typeof a === "undefined" && typeof b === "undefined") {
                    return true
                }

                if (typeof a === "undefined" || typeof b === "undefined") {
                    return false
                }

                return Temporal.PlainDate.compare(a, b) === 0
            },
        },
    )

    let [showingMonth, setShowingMonth] = useState<Temporal.PlainDate>(() =>
        Temporal.Now.plainDateISO().with({ day: 1 }),
    )

    let today = useTimedMemo(() => currentDate(), "day")

    let minValue = useTimedMemo(
        () => currentDate().subtract({ years: 10 }).with({ month: 1, day: 1 }),
        "day",
    )

    let { firstDayOfWeek, weekdays } = useWeekInfo()

    let rows = useMemo(() => {
        let rows: Temporal.PlainDate[][] = []

        let numOfRows = Math.ceil(showingMonth.daysInMonth / 7)
        let paddingStart = showingMonth.dayOfWeek - firstDayOfWeek

        let day = showingMonth.subtract({ days: paddingStart })

        for (let weekNum = 0; weekNum < numOfRows; weekNum++) {
            let week: Temporal.PlainDate[] = []
            for (let dayNum = 0; dayNum < 7; dayNum++) {
                week.push(day)
                day = day.add({ days: 1 })
            }

            rows.push(week)
        }

        return rows
    }, [showingMonth, firstDayOfWeek])

    let [focussed, _setFocussed] = useState<Temporal.PlainDate>(today)

    // biome-ignore lint/style/noNonNullAssertion: can never be not null
    let first = rows.at(0)?.at(0)!
    // biome-ignore lint/style/noNonNullAssertion: can never be not null
    let last = rows.at(-1)?.at(-1)!

    let setFocussed = useCallback(
        (next: Temporal.PlainDate) => {
            if (Temporal.PlainDateTime.compare(next, today) > 0) {
                return
            }

            if (Temporal.PlainDateTime.compare(next, minValue) < 0) {
                return
            }

            let minShown = first
            let maxShown = last

            if (
                Temporal.PlainDateTime.compare(next, minShown) < 0 ||
                Temporal.PlainDateTime.compare(maxShown, next) < 0
            ) {
                setShowingMonth(next.with({ day: 1 }))
            }

            _setFocussed(next)
            requestAnimationFrame(() => {
                let el = document.getElementById(`${next.month}-${next.day}`)
                el?.focus()
                el?.scrollIntoView({ inline: "center", block: "nearest" })
            })
        },
        [today, minValue, first, last],
    )

    let updateShowingMonth = useCallback(
        ({ month, year }: { month?: number; year?: number }) => {
            let next = showingMonth.with({ month, year })
            if (Temporal.PlainDateTime.compare(next, today) > 0) {
                next = today
            }

            setShowingMonth(next)
            setFocussed(focussed.with({ month, year }))
        },
        [showingMonth, today, setFocussed, focussed],
    )

    let focusRelative: FocusRelativeFn = useCallback(
        (dir, date) => {
            let next = date
            switch (dir) {
                case "up":
                    next = date.subtract({ days: 7 })
                    break
                case "down":
                    next = date.add({ days: 7 })
                    break
                case "left":
                    next = date.subtract({ days: 1 })
                    break
                case "right":
                    next = date.add({ days: 1 })
                    break
                case "home":
                    next = first
                    break
                case "end":
                    next = last
                    break
            }

            setFocussed(next)
        },
        [setFocussed, first, last],
    )

    let setSelectedDate = useCallback(
        (d: Temporal.PlainDate) => {
            if (selectedDate && Temporal.PlainDate.compare(selectedDate, d) === 0) {
                actions.memos.list.setFilter({ exactDate: undefined })
                return
            }
            actions.memos.list.setFilter({ exactDate: d })
            setShowingMonth(d.with({ day: 1 }))
            setFocussed(d)
        },
        [selectedDate, setFocussed],
    )

    return {
        selectedDate,
        setSelectedDate,
        showingMonth,
        updateShowingMonth,
        focussed,
        setFocussed,
        today,
        minValue,
        weekdays,
        rows,
        focusRelative,
    }
}
