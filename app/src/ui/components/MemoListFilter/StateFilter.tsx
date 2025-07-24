import { Toggle } from "@base-ui-components/react/toggle"
import { ToggleGroup } from "@base-ui-components/react/toggle-group"
import { useStore } from "@tanstack/react-store"
import clsx from "clsx"
import React, { useCallback, useMemo } from "react"

import { ArchiveIcon, BinIcon } from "@/ui/components/Icons"
import { useT } from "@/ui/i18n"
import { actions, selectors, stores } from "@/ui/stores"

export interface StateFilterProps {
    className?: string
}

export function StateFilter(props: StateFilterProps) {
    let t = useT("components/MemoListFilter/StateFilter")
    let isDeletedFilter = useStore(
        stores.memos.list.filter,
        selectors.memos.list.filter("isDeleted"),
    )
    let isArchivedFilter = useStore(
        stores.memos.list.filter,
        selectors.memos.list.filter("isArchived"),
    )
    let selected = useMemo(() => {
        if (isArchivedFilter) {
            return ["isArchived"]
        }

        if (isDeletedFilter) {
            return ["isDeleted"]
        }

        return []
    }, [isArchivedFilter, isDeletedFilter])

    let onSelect = useCallback(([selected]: any[]) => {
        if (selected === "isArchived") {
            actions.memos.list.setFilter({ isArchived: true, isDeleted: undefined })
            return
        }

        if (selected === "isDeleted") {
            actions.memos.list.setFilter({ isArchived: undefined, isDeleted: true })
            return
        }

        actions.memos.list.setFilter({ isArchived: undefined, isDeleted: undefined })
    }, [])

    return (
        <ToggleGroup
            aria-label={t.Label}
            className={clsx("state-filter", props.className)}
            value={selected}
            onValueChange={onSelect}
        >
            <Toggle value="isArchived" className="state-filter-item">
                <ArchiveIcon aria-hidden />
                <span>{t.Archived}</span>
            </Toggle>
            <Toggle value="isDeleted" className="state-filter-item">
                <BinIcon aria-hidden />
                <span>{t.Deleted}</span>
            </Toggle>
        </ToggleGroup>
    )
}
