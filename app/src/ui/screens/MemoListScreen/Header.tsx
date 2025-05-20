import React from "react"

import type { ListMemosQuery as Filter } from "@/domain/Memo"
import { AppHeader } from "@/ui/components/AppHeader"
import { DateTime } from "@/ui/components/DateTime"
import { Greeting } from "@/ui/components/Greeting"
import { useT } from "@/ui/i18n"

export function Header({ filter }: { filter: Filter }) {
    let t = useT("components/MemoListHeader")

    if (!filter) {
        return (
            <header className="memo-list-header">
                <Greeting key="greeting" />
            </header>
        )
    }

    let children: React.ReactNode[] = []

    if (filter.isDeleted) {
        children.push(t.Deleted)
    }

    if (filter.isArchived) {
        children.push(t.Archived)
    }

    if (filter.tag) {
        children.push(t.MemosForTag, " ", <em key="tag">{`#${filter.tag}`}</em>)
    }

    if (filter.exactDate) {
        children.push(
            children.length === 0
                ? t.MemosForExactDateStandalone
                : t.MemosForExactDate,
            " ",
            <em key="exactDate">
                <DateTime
                    date={filter.exactDate}
                    opts={{ dateStyle: "medium" }}
                />
            </em>,
        )
    }

    if (filter.query) {
        children.push(
            children.length === 0 ? t.MemosForQueryStandalone : t.MemosForQuery,
            " ",
            <em key="query">{`"${filter.query}"`}</em>,
        )
    }

    if (children.length === 0) {
        children = [<Greeting key="greeting" />]
    }

    return (
        <AppHeader position="centre" id="memo-list-header">
            <div className="memo-list-header">
                <div>{children}</div>
            </div>
        </AppHeader>
    )
}
