import { Toggle } from "@base-ui-components/react/toggle"
import { ToggleGroup } from "@base-ui-components/react/toggle-group"
import clsx from "clsx"
import React, { useMemo } from "react"

import { ArchiveIcon, BinIcon } from "@/ui/components/Icons"
import { useT } from "@/ui/i18n"

export interface StateFilterProps {
    className?: string
    onSelect: (state?: "isArchived" | "isDeleted") => void
    selected: { isArchived?: boolean; isDeleted?: boolean }
}

export function StateFilter(props: StateFilterProps) {
    let t = useT("components/MemoListFilter/StateFilter")
    let selected = useMemo(() => {
        if (props.selected.isArchived) {
            return ["isArchived"]
        }

        if (props.selected.isDeleted) {
            return ["isDeleted"]
        }

        return []
    }, [props.selected.isArchived, props.selected.isDeleted])

    return (
        <ToggleGroup
            aria-label={t.Label}
            className={clsx("state-filter", props.className)}
            value={selected}
            onValueChange={([selected]) => {
                props.onSelect(selected)
            }}
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
