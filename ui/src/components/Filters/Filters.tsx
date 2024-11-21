import type { Tag } from "@/domain/Tag"
import clsx from "clsx"
import React, { useCallback } from "react"
import { Loader } from "../Loader"
import { Calendar } from "./Calendar"
import { SearchBar } from "./SearchBar"
import { TagTree } from "./TagTree"

export interface Filter {
    tag?: string
    query?: string
    exactDate?: Date
    startDate?: Date
}

export interface FiltersProps {
    className?: string
    tags: { tags: Tag[]; isLoading: boolean; nextPage: () => void }
    filters: Filter
    onChangeFilter: (f: Filter) => void
}

export function Filters(props: FiltersProps) {
    let onChangeSearch = useCallback(
        (query: string) => {
            props.onChangeFilter({
                ...props.filters,
                query,
            })
        },
        [props.filters, props.onChangeFilter],
    )

    let onSelectTag = useCallback(
        (selected?: string) => {
            props.onChangeFilter({
                ...props.filters,
                tag: selected,
            })
        },
        [props.filters, props.onChangeFilter],
    )

    let onSelectDate = useCallback(
        (date: Date | undefined) => {
            props.onChangeFilter({
                ...props.filters,
                exactDate: date,
            })
        },
        [props.filters, props.onChangeFilter],
    )

    return (
        <div className={clsx("space-y-4", props.className)}>
            <SearchBar onChange={onChangeSearch} />

            <Calendar
                onSelect={onSelectDate}
                selected={props.filters.exactDate}
            />

            <TagTree
                tags={props.tags.tags}
                onSelect={onSelectTag}
                selected={props.filters.tag}
                onEOLReached={props.tags.nextPage}
            />

            {props.tags.isLoading && (
                <div className="flex justify-center items-center min-h-[100px]">
                    <Loader />
                </div>
            )}
        </div>
    )
}
