import { Button } from "@/components/Button"
import { useDateFnsLocale, useT } from "@/i18n"
import { CaretDown, CaretLeft, CaretRight } from "@phosphor-icons/react"
import clsx from "clsx"
import React, { startTransition, useCallback, useEffect, useState } from "react"
import { DayPicker } from "react-day-picker"

export interface CalendarProps {
    className?: string
    selected?: Date
    onSelect: (date?: Date) => void
}

export function Calendar({ className, ...props }: CalendarProps) {
    let locale = useDateFnsLocale()
    let t = useT("components/Filters/Calendar")
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
            className={clsx("w-full", className)}
            onSelect={onSelect}
            selected={selected}
            month={month}
            onMonthChange={setMonth}
            endMonth={new Date()}
            weekStartsOn={locale?.options?.weekStartsOn || 1}
            mode="single"
            locale={locale}
            classNames={{
                months: "flex flex-wrap gap-2 relative w-full",
                nav: "flex align-center absolute top-0 right-0 h-6",
                month_caption: "flex h-6 md:px-3",
                dropdowns: "inline-flex align-center gap-1 relative",
                dropdown_root: "inline-flex align-center relative group",
                months_dropdown:
                    "appearance-none border-0 absolute inset-0 opacity-0 w-full z-20 -left-1",
                caption:
                    "items-center inline-flex nowrap relative z-10 border-0",
                caption_label:
                    "flex items-center -ml-1 lg:-ml-3 mr-1 p-1 lg:p-2 rounded group-hover:bg-subtle text-sm sm:text-base",
                years_dropdown:
                    "appearance-none border-0 absolute inset-0 opacity-0 w-full z-20",
                month: "w-full",
                month_grid: "w-full mt-4",
                table: "w-full border-collapse space-y-1",
                weekday:
                    "text-subtle-dark font-light text-sm pb-2 cursor-default",
                day: "text-center cursor-pointer rounded hover:bg-subtle",
                day_outside: "text-subtle",
                day_selected: "bg-primary",
                today: "bg-primary-light",
                selected:
                    "!bg-primary-dark !text-primary-contrast !hover:bg-primary-dark",
                outside: "text-subtle-dark",
                day_button:
                    "p-1.5 w-full h-full aspect-square flex items-center justify-center",
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
                        iconLeft={<CaretRight />}
                        plain={true}
                        size="sm"
                        {...props}
                        className={clsx("!px-0.5", props.className)}
                    />
                ),
                PreviousMonthButton: ({ children, ...props }) => (
                    <Button
                        iconLeft={<CaretLeft />}
                        plain={true}
                        size="sm"
                        {...props}
                        className={clsx("!px-0.5", props.className)}
                    />
                ),
                Chevron: () => <CaretDown className="size-4 ml-1" />,
            }}
        />
    )
}
