import React, { useMemo } from "react"

import { differenceInCalendarDays } from "@/lib/date"
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
        let { time, formatDistance } = useFormat()

        let formatted = useMemo(() => {
            try {
                if (!relative) {
                    return time(
                        date,
                        opts ?? { dateStyle: "long", timeStyle: "short" },
                    )
                }

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
        }, [
            date,
            time,
            opts,
            relative,
            formatDistance,
            t.datetime,
            t.invalidTime,
        ])

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
