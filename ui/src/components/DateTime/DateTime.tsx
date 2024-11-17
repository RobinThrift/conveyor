import { useFormat, useT } from "@/i18n"
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
        let { time } = useFormat()

        let formatted = useMemo(() => {
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
                    date: formatDistance(date, now, { addSuffix: true }),
                    time: time(date, { timeStyle: "short" }),
                })
            }

            return time(date, { dateStyle: "long", timeStyle: "medium" })
        }, [date, time, opts, relative, t.datetime])

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
