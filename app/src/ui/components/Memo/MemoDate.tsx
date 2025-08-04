import React from "react"

import { DateTime } from "@/ui/components/DateTime"

export function MemoDate({ createdAt }: { createdAt: Date }) {
    return (
        <div className="memo-date">
            <DateTime
                date={createdAt}
                className="memo-date sm"
                relative
                opts={{ dateStyle: "medium", timeStyle: "short" }}
            />
            <DateTime date={createdAt} className="memo-date md" relative />
        </div>
    )
}
