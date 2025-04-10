import clsx from "clsx"
import React, { useCallback, useMemo, useState } from "react"
import { DateFormatter } from "@internationalized/date"
import {
    Calendar as AriaCalendar,
    CalendarGrid as AriaCalendarGrid,
    CalendarGridHeader as AriaCalendarGridHeader,
    CalendarHeaderCell as AriaCalendarHeaderCell,
    CalendarGridBody as AriaCalendarGridBody,
    DateValue,
} from "react-aria-components"

import {
    type CalendarDate,
    currentDateTime,
    getLocalTimeZone,
    isSameDay,
} from "@/lib/i18n"
import { Button } from "@/ui/components/Button"
import { CaretLeftIcon, CaretRightIcon } from "@/ui/components/Icons"
import { useT } from "@/ui/i18n"

import { CalendarCell } from "./CalendarCell"

export interface DatePickerProps {
    className?: string
    selected?: CalendarDate
    onSelect: (date?: CalendarDate) => void
}

export function DatePicker({ className, ...props }: DatePickerProps) {
    let t = useT("components/MemoListFilter/DatePicker")
    let [focusedDate, setFocusedDate] = useState<CalendarDate>(
        props.selected ?? currentDateTime(),
    )

    let onClickTodayBtn = useCallback(() => {
        setFocusedDate(currentDateTime())
    }, [])

    let today = useMemo(() => {
        return currentDateTime()
    }, [])

    let onChange = useCallback(
        (value: DateValue) => {
            props.onSelect(value as CalendarDate)
        },
        [props.onSelect],
    )

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
                value={props.selected ?? null}
                className="date-picker-calendar"
            >
                <header className="date-picker-header">
                    <Button
                        iconLeft={<CaretLeftIcon />}
                        plain={true}
                        slot="previous"
                    />
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
                    <Button
                        iconLeft={<CaretRightIcon />}
                        plain={true}
                        slot="next"
                    />
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
                <Button
                    size="sm"
                    variant="primary"
                    outline={true}
                    onPress={onClickTodayBtn}
                >
                    {t.Today}
                </Button>
            </div>
        </div>
    )

    // return (
    //     <DayPicker
    //         captionLayout="dropdown"
    //         showOutsideDays={true}
    //         className={clsx("date-picker", className)}
    //         onSelect={onSelect}
    //         selected={selected}
    //         month={month}
    //         onMonthChange={setMonth}
    //         endMonth={new Date()}
    //         disabled={{ after: new Date() }}
    //         weekStartsOn={locale?.options?.weekStartsOn || 1}
    //         mode="single"
    //         fixedWeeks
    //         locale={locale}
    //         classNames={{
    //             nav: "nav",
    //             button_next: "nav-btn",
    //             button_previous: "nav-btn",
    //
    //             dropdowns: "dropdowns",
    //             dropdown_root: "dropdown",
    //
    //             months_dropdown: "months-dropdown",
    //             years_dropdown: "years-dropdown",
    //
    //             caption: "caption",
    //             caption_label: "caption-label",
    //             month_caption: "month-caption",
    //
    //             weekday: "weekday",
    //
    //             months: "months",
    //             month: "month",
    //             month_grid: "month-grid",
    //
    //             today: "today",
    //             day: "day",
    //             day_outside: "outside",
    //             day_selected: "selected",
    //             day_button: "day-btn",
    //
    //             selected: "selected",
    //             outside: "outside",
    //         }}
    //         footer={
    //             <div className="mt-2 flex justify-end">
    //                 <Button
    //                     size="sm"
    //                     variant="primary"
    //                     outline={true}
    //                     onClick={onClickTodayBtn}
    //                 >
    //                     {t.Today}
    //                 </Button>
    //             </div>
    //         }
    //         components={{
    //             NextMonthButton: ({ children, ...props }) => (
    //                 <Button
    //                     iconLeft={<CaretRightIcon />}
    //                     plain={true}
    //                     {...props}
    //                 />
    //             ),
    //             PreviousMonthButton: ({ children, ...props }) => (
    //                 <Button
    //                     iconLeft={<CaretLeftIcon />}
    //                     plain={true}
    //                     {...props}
    //                 />
    //             ),
    //             Chevron: () => <CaretDownIcon className="size-4 ml-1" />,
    //         }}
    //     />
    // )
}

function MonthDropdown({
    currentMonth,
    maxValue,
    setMonth,
}: {
    currentMonth: CalendarDate
    maxValue: CalendarDate
    setMonth: (m: CalendarDate) => void
}) {
    let formatter = useMemo(() => {
        return new DateFormatter("en", { month: "long" })
    }, [])

    let months = useMemo(() => {
        let months: { value: number; label: string; isDisabled: boolean }[] = []
        let numMonths = currentMonth.calendar.getMonthsInYear(currentMonth)
        for (let i = 1; i <= numMonths; i++) {
            let date = currentMonth.set({ month: i })
            months.push({
                value: i,
                label: formatter.format(date.toDate(getLocalTimeZone())),
                isDisabled: maxValue.compare(date) < 0,
            })
        }

        return months
    }, [currentMonth, formatter])

    let onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        let value = Number(e.target.value)
        let nextMonth = currentMonth.set({ month: value })
        setMonth(nextMonth)
    }

    return (
        <select
            aria-label="Month"
            onChange={onChange}
            value={currentMonth.month}
        >
            {months.map((month) => (
                <option
                    key={month.value}
                    value={month.value}
                    disabled={month.isDisabled}
                >
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
    let formatter = useMemo(() => {
        return new DateFormatter("en", { year: "numeric" })
    }, [])

    let years = useMemo(() => {
        let years = []
        for (let i = -20; i <= 20; i++) {
            let date = currentYear.add({ years: i })
            if (date.year > maxValue.year) {
                break
            }
            years.push({
                value: date,
                formatted: formatter.format(date.toDate(getLocalTimeZone())),
            })
        }
        return years
    }, [currentYear.year])

    let onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        let index = Number(e.target.value)
        let selctedYear = years[index].value
        setYear(selctedYear)
    }

    return (
        <select aria-label="Year" onChange={onChange} value={20}>
            {years.map((year, i) => (
                <option key={i} value={i}>
                    {year.formatted}
                </option>
            ))}
        </select>
    )
}
