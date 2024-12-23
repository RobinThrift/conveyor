import type { ListMemosQuery } from "@/domain/Memo"
import type { Tag } from "@/domain/Tag"
import { useIsMobile } from "@/hooks/useIsMobile"
import { useT } from "@/i18n"
import { FilterOverlay } from "@/pages/Memos/List/FilterOverlay"
import * as Tabs from "@radix-ui/react-tabs"
import clsx from "clsx"
import React, { useCallback } from "react"
import { Loader } from "../Loader"
import { Calendar } from "./Calendar"
import { SearchBar } from "./SearchBar"
import { TagTree } from "./TagTree"

export type Filter = ListMemosQuery

export interface FiltersProps {
    className?: string
    tags: { tags: Tag[]; isLoading: boolean; nextPage: () => void }
    filters: Filter
    onChangeFilter: (f: Filter) => void
}

export function Filters(props: FiltersProps) {
    let isMobile = useIsMobile()

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

    if (isMobile) {
        return (
            <FilterOverlay>
                <FilterTabs
                    className={props.className}
                    tags={props.tags}
                    filters={props.filters}
                    onChangeSearch={onChangeSearch}
                    onChangeFilter={props.onChangeFilter}
                    onSelectDate={onSelectDate}
                    onSelectTag={onSelectTag}
                />
            </FilterOverlay>
        )
    }

    return (
        <FilterList
            className={props.className}
            tags={props.tags}
            filters={props.filters}
            onChangeSearch={onChangeSearch}
            onChangeFilter={props.onChangeFilter}
            onSelectDate={onSelectDate}
            onSelectTag={onSelectTag}
        />
    )
}

interface FilterListProps {
    className?: string
    tags: { tags: Tag[]; isLoading: boolean; nextPage: () => void }
    filters: Filter
    onChangeSearch: (query: string) => void
    onChangeFilter: (f: Filter) => void
    onSelectDate: (date: Date | undefined) => void
    onSelectTag: (selected?: string) => void
}

function FilterList(props: FilterListProps) {
    return (
        <div className={props.className}>
            <div className="space-y-4 flex flex-col tablet:h-full tablet:pb-4 w-full">
                <SearchBar onChange={props.onChangeSearch} />

                <Calendar
                    onSelect={props.onSelectDate}
                    selected={props.filters.exactDate}
                />

                <TagTree
                    tags={props.tags.tags}
                    onSelect={props.onSelectTag}
                    selected={props.filters.tag}
                    className="sm:overflow-auto flex-1 pb-2 overscroll-contain"
                />

                {props.tags.isLoading && (
                    <div className="flex justify-center items-center min-h-[100px]">
                        <Loader />
                    </div>
                )}
            </div>
        </div>
    )
}

interface FilterTabsProps {
    className?: string
    tags: { tags: Tag[]; isLoading: boolean; nextPage: () => void }
    filters: Filter
    onChangeSearch: (query: string) => void
    onChangeFilter: (f: Filter) => void
    onSelectDate: (date: Date | undefined) => void
    onSelectTag: (selected?: string) => void
}

function FilterTabs(props: FilterTabsProps) {
    let t = useT("components/Filters")

    return (
        <Tabs.Root
            className={clsx("filter-tabs", props.className)}
            defaultValue="date"
        >
            <SearchBar
                onChange={props.onChangeSearch}
                className="filter-searchbar"
            />

            <Tabs.List className="filter-tabs-items">
                <Tabs.Trigger className="filter-tabs-item" value="date">
                    {t.TabDate}
                </Tabs.Trigger>

                <Tabs.Trigger className="filter-tabs-item" value="tags">
                    {t.TabTags}
                </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="date">
                <Calendar
                    onSelect={props.onSelectDate}
                    selected={props.filters.exactDate}
                />
            </Tabs.Content>

            <Tabs.Content value="tags">
                <TagTree
                    tags={props.tags.tags}
                    onSelect={props.onSelectTag}
                    selected={props.filters.tag}
                    className="sm:overflow-auto flex-1 pb-2 overscroll-contain"
                />
                {props.tags.isLoading && (
                    <div className="flex justify-center items-center min-h-[100px]">
                        <Loader />
                    </div>
                )}
            </Tabs.Content>
        </Tabs.Root>
    )
}
