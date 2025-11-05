import React, { useMemo } from "react"

import { calendarDateTimeFromDate, currentDateTime, type DateLike } from "@/lib/i18n"
import { useFormat, useT } from "@/ui/i18n"

export interface DateTimeProps<D extends DateLike>
    extends Omit<
        React.DetailedHTMLProps<React.TimeHTMLAttributes<HTMLTimeElement>, HTMLTimeElement>,
        "datetime"
    > {
    className?: string
    date: D
    relative?: boolean
    opts?: Intl.DateTimeFormatOptions
    ref?: React.Ref<HTMLTimeElement>
}

export const DateTime = React.memo(function DateTime<D extends DateLike>({
    relative,
    ...props
}: DateTimeProps<D>) {
    if (relative) {
        return <RelativeDateTime {...props} />
    }

    return <AbsoluteDateTime {...props} />
})

const AbsoluteDateTime = React.memo(function AbsoluteDateTime<D extends DateLike>({
    date,
    opts,
    ref,
    ...intrinsics
}: DateTimeProps<D>) {
    let t = useT("components/DateTime")
    let { formatDateTime } = useFormat()

    let formatted = useMemo(() => {
        try {
            return formatDateTime(
                calendarDateTimeFromDate(date as Date),
                opts ?? { dateStyle: "long", timeStyle: "short" },
            )
        } catch (err) {
            return t.invalidTime({
                date: date?.toString(),
                error: (err as Error).message,
            })
        }
    }, [date, formatDateTime, opts, t.invalidTime])

    return (
        <time {...intrinsics} dateTime={JSON.stringify(date).replaceAll(`"`, "")} ref={ref}>
            {formatted}
        </time>
    )
})

const RelativeDateTime = React.memo(function RelativeDateTime<D extends DateLike>({
    date,
    opts,
    ref,
    ...intrinsics
}: Omit<DateTimeProps<D>, "relative">) {
    let t = useT("components/DateTime")
    let { formatRelative } = useFormat()

    let formatted = useMemo(() => {
        try {
            let formatted = formatRelative(
                currentDateTime(),
                calendarDateTimeFromDate(date as Date),
                opts,
            )

            if (opts && "dateStyle" in opts && typeof opts?.dateStyle === "undefined") {
                return formatted.time
            }

            return t.datetime(formatted)
        } catch (err) {
            return t.invalidTime({
                date: date?.toString(),
                error: (err as Error).message,
            })
        }
    }, [date, formatRelative, opts, t.datetime, t.invalidTime])

    return (
        <time {...intrinsics} dateTime={JSON.stringify(date)} ref={ref}>
            {formatted}
        </time>
    )
})
