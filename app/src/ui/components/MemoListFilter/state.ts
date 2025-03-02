import type { ListMemosQuery } from "@/domain/Memo"
import { useCallback, useMemo, useState } from "react"

export type Filter = ListMemosQuery

export function useMemoListFilterState(props: {
    filter: Filter
    onChangeFilter: (f: Filter) => void
}) {
    let [collapsibileDatePickerExpaned, setCollapsibileDatePickerExpaned] =
        useState(false)

    let onChangeSearch = useCallback(
        (query: string) => {
            props.onChangeFilter({
                ...props.filter,
                query,
            })
        },
        [props.filter, props.onChangeFilter],
    )

    let onSelectDate = useCallback(
        (date: Date | undefined) => {
            props.onChangeFilter({
                ...props.filter,
                exactDate: date,
            })
        },
        [props.filter, props.onChangeFilter],
    )

    let onSelectTag = useCallback(
        (selected?: string) => {
            props.onChangeFilter({
                ...props.filter,
                tag: selected,
            })
        },
        [props.filter, props.onChangeFilter],
    )

    let onSelectStateFilter = useCallback(
        (state?: "isArchived" | "isDeleted") => {
            let { isArchived, isDeleted, ...filter } = props.filter

            switch (state) {
                case "isArchived":
                    props.onChangeFilter({
                        ...filter,
                        isArchived: true,
                    })
                    return
                case "isDeleted":
                    props.onChangeFilter({
                        ...filter,
                        isDeleted: true,
                    })
                    return
            }

            props.onChangeFilter(filter)
        },
        [props.filter, props.onChangeFilter],
    )

    return useMemo(
        () => ({
            datepicker: {
                expanded: collapsibileDatePickerExpaned,
                setExpanded: setCollapsibileDatePickerExpaned,
            },
            onChangeSearch,
            onSelectDate,
            onSelectTag,
            onSelectStateFilter,
        }),
        [
            collapsibileDatePickerExpaned,
            onChangeSearch,
            onSelectDate,
            onSelectTag,
            onSelectStateFilter,
        ],
    )
}
