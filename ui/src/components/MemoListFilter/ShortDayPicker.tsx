import { useDateFnsLocale } from "@/i18n"
import clsx from "clsx"
import React, {
    startTransition,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react"
import { DayPicker } from "react-day-picker"

export interface ShortDayPickerProps {
    className?: string
    selected?: Date
    onSelect: (date?: Date) => void
}

export function ShortDayPicker({ ...props }: ShortDayPickerProps) {
    let scrollToRef = useRef<HTMLTableCellElement | null>(null)
    let locale = useDateFnsLocale()
    let [selected, setSelected] = useState<Date | undefined>(
        props.selected ?? new Date(),
    )
    let [month, setMonth] = useState<Date | undefined>(
        props.selected ?? new Date(),
    )

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
        <DayPicker
            className={clsx("short-day-picker", props.className)}
            onSelect={onSelect}
            selected={selected}
            month={month}
            weekStartsOn={locale?.options?.weekStartsOn || 1}
            fixedWeeks
            locale={locale}
            mode="single"
            hidden={{ after: new Date() }}
            hideNavigation
            showOutsideDays={true}
            classNames={{
                caption_label: "caption",

                months: "months",
                month: "month",
                month_grid: "month-grid",

                weekdays: "weekdays",
                weekday: "weekday",
                weeks: "weeks",
                week: "week",

                day: "day",
                day_button: "day-btn",
                hidden: "hidden",
                today: "today",
                outside: "outside",
                selected: "selected",
                day_hidden: "bg-subtle-extra-light",
            }}
            components={{
                Day: ({ day, modifiers: _, ...tdProps }) => {
                    if (
                        selected &&
                        "data-selected" in tdProps &&
                        tdProps["data-selected"]
                    ) {
                        return <td {...tdProps} ref={scrollToRef} />
                    }

                    if (
                        !selected &&
                        "data-today" in tdProps &&
                        tdProps["data-today"]
                    ) {
                        return <td {...tdProps} ref={scrollToRef} />
                    }

                    return <td {...tdProps} />
                },
            }}
        />
    )
}
