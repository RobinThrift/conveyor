import React, { useMemo, useState } from "react"

import { differenceInCalendarDays } from "@/lib/date"
import { Tooltip } from "@/ui/components/Tooltip"
import { useFormat, useT } from "@/ui/i18n"

export interface DateTimeProps
    extends Omit<
        React.DetailedHTMLProps<
            React.TimeHTMLAttributes<HTMLTimeElement>,
            HTMLTimeElement
        >,
        "datetime"
    > {
    className?: string
    date: Date
    relative?: boolean
    opts?: Intl.DateTimeFormatOptions
}

export const DateTime = React.forwardRef<HTMLTimeElement, DateTimeProps>(
    function DateTime({ relative, date, opts, ...intrinsics }, forwardedRef) {
        let t = useT("components/DateTime")
        let { time } = useFormat()

        let formatted = useMemo(() => {
            try {
                return time(
                    date,
                    opts ?? { dateStyle: "long", timeStyle: "short" },
                )
            } catch (err) {
                return t.invalidTime({
                    date: date?.toString(),
                    error: (err as Error).message,
                })
            }
        }, [date, time, opts, t.invalidTime])

        if (relative) {
            return (
                <RelativeDateTime
                    {...intrinsics}
                    ref={forwardedRef}
                    date={date}
                    opts={opts}
                    absolute={formatted}
                />
            )
        }

        return (
            <time
                {...intrinsics}
                dateTime={JSON.stringify(date)}
                ref={forwardedRef}
            >
                {formatted}
            </time>
        )
    },
)

const RelativeDateTime = React.forwardRef<
    HTMLTimeElement,
    Omit<DateTimeProps, "relative"> & { absolute: string }
>(function RelativeDateTime(
    { date, opts, absolute, ...intrinsics },
    forwardedRef,
) {
    let t = useT("components/DateTime")
    let { time, formatDistance } = useFormat()

    let [showAbsolute, setShowAbsolute] = useState(false)

    let formatted = useMemo(() => {
        if (showAbsolute) {
            return absolute
        }
        try {
            let now = new Date()
            let diff = differenceInCalendarDays(date, now)
            if (Math.abs(diff) <= 3) {
                return t.datetime({
                    date: formatDistance(date, now, {
                        addSuffix: true,
                    }),
                    time: time(date, { timeStyle: "short" }),
                })
            }

            return time(date, opts ?? { dateStyle: "long", timeStyle: "short" })
        } catch (err) {
            return t.invalidTime({
                date: date?.toString(),
                error: (err as Error).message,
            })
        }
    }, [
        date,
        absolute,
        showAbsolute,
        time,
        formatDistance,
        opts,
        t.datetime,
        t.invalidTime,
    ])

    return (
        <Tooltip
            content={
                showAbsolute
                    ? t.ShowRelativeDateTooltip
                    : t.ShowAbsoluteDateTooltip
            }
        >
            <button
                type="button"
                tabIndex={0}
                onClick={() => setShowAbsolute(!showAbsolute)}
                aria-label={
                    showAbsolute
                        ? t.ShowRelativeDateTooltip
                        : t.ShowAbsoluteDateTooltip
                }
                aria-pressed={showAbsolute}
            >
                <time
                    {...intrinsics}
                    dateTime={JSON.stringify(date)}
                    ref={forwardedRef}
                >
                    {formatted}
                </time>
            </button>
        </Tooltip>
    )
})
