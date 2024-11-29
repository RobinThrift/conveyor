import { useDateFnsLocale, useFormat, useT } from "@/i18n"
import { differenceInCalendarDays, formatDistance } from "date-fns"
import React, { useMemo } from "react"

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
        let locale = useDateFnsLocale()
        let { time } = useFormat()

        let formatted = useMemo(() => {
            try {
                if (!relative) {
                    return time(
                        date,
                        opts ?? { dateStyle: "long", timeStyle: "medium" },
                    )
                }

                let now = new Date()
                let diff = differenceInCalendarDays(date, now)
                if (Math.abs(diff) <= 3) {
                    return t.datetime({
                        date: formatDistance(date, now, {
                            addSuffix: true,
                            locale,
                        }),
                        time: time(date, { timeStyle: "short" }),
                    })
                }

                return time(date, { dateStyle: "long", timeStyle: "medium" })
            } catch (err) {
                return t.invalidTime({
                    date: date?.toString(),
                    error: (err as Error).message,
                })
            }
        }, [date, time, locale, opts, relative, t.datetime, t.invalidTime])

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
