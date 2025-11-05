import React, { useMemo } from "react"
import type { Temporal } from "temporal-polyfill"

import { currentDateTime, differenceInCalendarDays, roundToNearestMinutes } from "@/lib/i18n"
import { DateTime } from "@/ui/components/DateTime"
import { useT } from "@/ui/i18n"

export const DayHeader = React.memo(function DayHeader({ date }: { date: Temporal.ZonedDateTime }) {
    let t = useT("components/MemoList/DayHeader")
    let prefix = useMemo(() => {
        let now = roundToNearestMinutes(currentDateTime())
        let diffToToday = differenceInCalendarDays(date.toPlainDate(), now.toPlainDate())
        if (diffToToday < 1) {
            return t.Today
        } else if (diffToToday === 1) {
            return t.Yesterday
        }
    }, [date, t.Today, t.Yesterday])

    let formatted = <DateTime date={date} opts={{ dateStyle: "long" }} />

    if (prefix) {
        formatted = (
            <>
                {prefix}
                <span className="named-day-date">({formatted})</span>
            </>
        )
    }

    return (
        <>
            <div className="memo-list-day">
                <div className="memo-list-day-date">{formatted}</div>
            </div>
            <div className="memo-list-day-divider" aria-hidden="true" />
        </>
    )
})
