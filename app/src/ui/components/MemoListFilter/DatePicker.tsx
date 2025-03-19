import clsx from "clsx"
import React, { startTransition, useCallback, useEffect, useState } from "react"
import { DayPicker } from "react-day-picker"

import { Button } from "@/ui/components/Button"
import { useDateTimeLocale, useT } from "@/ui/i18n"
import {
    CaretDownIcon,
    CaretLeftIcon,
    CaretRightIcon,
} from "@/ui/components/Icons"

export interface DatePickerProps {
    className?: string
    selected?: Date
    onSelect: (date?: Date) => void
}

export function DatePicker({ className, ...props }: DatePickerProps) {
    let locale = useDateTimeLocale()
    let t = useT("components/MemoListFilter/DatePicker")
    let [selected, setSelected] = useState<Date | undefined>(
        props.selected ?? new Date(),
    )
    let [month, setMonth] = useState<Date | undefined>(
        props.selected ?? new Date(),
    )

    let onClickTodayBtn = useCallback(() => {
        setMonth(new Date())
    }, [])

    let onSelect = useCallback(
        (date: Date | undefined) => {
            setSelected(date)
            setMonth(date)
            props.onSelect(date)
        },
        [props.onSelect],
    )

    useEffect(() => {
        startTransition(() => {
            setSelected((selected) => {
                if (props.selected !== selected) {
                    return props.selected
                }
                return selected
            })

            setMonth((month) => {
                if (props.selected !== month) {
                    return props.selected
                }
                return month
            })
        })
    }, [props.selected])

    return (
        <DayPicker
            captionLayout="dropdown"
            showOutsideDays={true}
            className={clsx("date-picker", className)}
            onSelect={onSelect}
            selected={selected}
            month={month}
            onMonthChange={setMonth}
            endMonth={new Date()}
            disabled={{ after: new Date() }}
            weekStartsOn={locale?.options?.weekStartsOn || 1}
            mode="single"
            fixedWeeks
            locale={locale}
            classNames={{
                nav: "nav",
                button_next: "nav-btn",
                button_previous: "nav-btn",

                dropdowns: "dropdowns",
                dropdown_root: "dropdown",

                months_dropdown: "months-dropdown",
                years_dropdown: "years-dropdown",

                caption: "caption",
                caption_label: "caption-label",
                month_caption: "month-caption",

                weekday: "weekday",

                months: "months",
                month: "month",
                month_grid: "month-grid",

                today: "today",
                day: "day",
                day_outside: "outside",
                day_selected: "selected",
                day_button: "day-btn",

                selected: "selected",
                outside: "outside",
            }}
            footer={
                <div className="mt-2 flex justify-end">
                    <Button
                        size="sm"
                        variant="primary"
                        outline={true}
                        onClick={onClickTodayBtn}
                    >
                        {t.Today}
                    </Button>
                </div>
            }
            components={{
                NextMonthButton: ({ children, ...props }) => (
                    <Button
                        iconLeft={<CaretRightIcon />}
                        plain={true}
                        {...props}
                    />
                ),
                PreviousMonthButton: ({ children, ...props }) => (
                    <Button
                        iconLeft={<CaretLeftIcon />}
                        plain={true}
                        {...props}
                    />
                ),
                Chevron: () => <CaretDownIcon className="size-4 ml-1" />,
            }}
        />
    )
}
