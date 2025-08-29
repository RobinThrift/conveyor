import { useStore } from "@tanstack/react-store"
import React from "react"

import { AppHeader } from "@/ui/components/AppHeader"
import { DateTime } from "@/ui/components/DateTime"
import { useT } from "@/ui/i18n"
import { stores } from "@/ui/stores"

export function Header() {
    let t = useT("components/MemoListHeader")
    let filter = useStore(stores.memos.list.filter)

    if (!filter) {
        return <header className="memo-list-header" />
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
        if (children.length > 1) {
            children.push(" ")
        }

        children.push(
            children.length === 0 ? t.MemosForExactDateStandalone : t.MemosForExactDate,
            " ",
            <em key="exactDate">
                <DateTime date={filter.exactDate} opts={{ dateStyle: "medium" }} />
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

    return (
        <AppHeader position="centre" id="memo-list-header">
            <div className="memo-list-header">
                <div>{children}</div>
            </div>
        </AppHeader>
    )
}
