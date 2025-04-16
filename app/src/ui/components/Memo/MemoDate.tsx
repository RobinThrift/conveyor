import React from "react"

import { DateTime } from "@/ui/components/DateTime"

export function MemoDate({
    createdAt,
}: {
    createdAt: Date
}) {
    return (
        <>
            <DateTime
                date={createdAt}
                className="memo-date sm"
                relative
                opts={{ dateStyle: "medium", timeStyle: "short" }}
            />
            <DateTime date={createdAt} className="memo-date md" relative />
        </>
    )
}
