import React, { useMemo, useState } from "react"
import { ToggleButton as AriaButton } from "react-aria-components"

import { type CalendarDate, type CalendarDateTime, currentDateTime } from "@/lib/i18n"
import { Tooltip } from "@/ui/components/Tooltip"
import { useFormat, useT } from "@/ui/i18n"

export interface DateTimeProps
    extends Omit<
        React.DetailedHTMLProps<React.TimeHTMLAttributes<HTMLTimeElement>, HTMLTimeElement>,
        "datetime"
    > {
    className?: string
    date: Date | CalendarDate | CalendarDateTime
    relative?: boolean
    opts?: Intl.DateTimeFormatOptions
    ref?: React.Ref<HTMLTimeElement>
}

export const DateTime = React.memo(function DateTime({
    relative,
    date,
    opts,
    ref,
    ...intrinsics
}: DateTimeProps) {
    let t = useT("components/DateTime")
    let { formatDateTime } = useFormat()

    let formatted = useMemo(() => {
        try {
            return formatDateTime(date, opts ?? { dateStyle: "long", timeStyle: "short" })
        } catch (err) {
            return t.invalidTime({
                date: date?.toString(),
                error: (err as Error).message,
            })
        }
    }, [date, formatDateTime, opts, t.invalidTime])

    if (relative) {
        return (
            <RelativeDateTime
                {...intrinsics}
                ref={ref}
                date={date}
                opts={opts}
                absolute={formatted}
            />
        )
    }

    return (
        <time {...intrinsics} dateTime={JSON.stringify(date).replaceAll(`"`, "")} ref={ref}>
            {formatted}
        </time>
    )
})

const RelativeDateTime = React.memo(function RelativeDateTime({
    date,
    opts,
    absolute,
    ref,
    buttonClassName,
    ...intrinsics
}: Omit<DateTimeProps, "relative"> & { absolute: string; buttonClassName?: string }) {
    let t = useT("components/DateTime")
    let { formatRelative } = useFormat()

    let [showAbsolute, setShowAbsolute] = useState(false)

    let formatted = useMemo(() => {
        if (showAbsolute) {
            return absolute
        }
        try {
            return t.datetime(formatRelative(currentDateTime(), date, opts))
        } catch (err) {
            return t.invalidTime({
                date: date?.toString(),
                error: (err as Error).message,
            })
        }
    }, [date, absolute, showAbsolute, formatRelative, opts, t.datetime, t.invalidTime])

    if (formatted === absolute) {
        return (
            <time {...intrinsics} dateTime={JSON.stringify(date)} ref={ref}>
                {formatted}
            </time>
        )
    }

    return (
        <Tooltip content={showAbsolute ? t.ShowRelativeDateTooltip : t.ShowAbsoluteDateTooltip}>
            <AriaButton
                type="button"
                className={buttonClassName}
                onChange={() => setShowAbsolute(!showAbsolute)}
                aria-label={showAbsolute ? t.ShowRelativeDateTooltip : t.ShowAbsoluteDateTooltip}
                isSelected={showAbsolute}
            >
                <time {...intrinsics} dateTime={JSON.stringify(date).replaceAll(`"`, "")} ref={ref}>
                    {formatted}
                </time>
            </AriaButton>
        </Tooltip>
    )
})
