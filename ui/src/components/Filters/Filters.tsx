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
    onChangeFilters: (f: Filter) => void
}

export function Filters(props: FiltersProps) {
    let onChangeSearch = useCallback(
        (query: string) => {
            props.onChangeFilters({
                ...props.filters,
                query,
            })
        },
        [props.filters, props.onChangeFilters],
    )

    let onSelectTag = useCallback(
        (selected?: string) => {
            props.onChangeFilters({
                ...props.filters,
                tag: selected,
            })
        },
        [props.filters, props.onChangeFilters],
    )

    let onSelectDate = useCallback(
        (date: Date | undefined) => {
            props.onChangeFilters({
                ...props.filters,
                exactDate: date,
            })
        },
        [props.filters, props.onChangeFilters],
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
