import React from "react"

import { DateTime } from "@/ui/components/DateTime"
import { useT } from "@/ui/i18n"

export const DayHeader = React.memo(function DayHeader({
    date,
    diffToToday,
}: {
    date: Date
    diffToToday: number
}) {
    let t = useT("components/MemoList/DayHeader")
    let prefix = ""
    if (diffToToday < 1) {
        prefix = t.Today
    } else if (diffToToday === 1) {
        prefix = t.Yesterday
    }

    if (prefix) {
        return (
            <h2 className="memo-list-day">
                {prefix}
                <span className="named-day-date">
                    (
                    <DateTime date={date} opts={{ dateStyle: "medium" }} />)
                </span>
            </h2>
        )
    }

    return (
        <h2 className="memo-list-day">
            {prefix} <DateTime date={date} opts={{ dateStyle: "medium" }} />
        </h2>
    )
})
