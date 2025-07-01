import type { ListMemosQuery } from "@/domain/Memo"
import type { Tag } from "@/domain/Tag"
import clsx from "clsx"
import React from "react"

import { Button } from "@/ui/components/Button"
import { CaretDownIcon, HashIcon } from "@/ui/components/Icons"
import { useT } from "@/ui/i18n"

import { AppHeader } from "../AppHeader"
import { DatePicker } from "./DatePicker"
import { SearchBar } from "./Searchbar"
import { ShortDayPicker } from "./ShortDayPicker"
import { StateFilter } from "./StateFilter"
import { TagTreeFilter, useTagTreeFilterStore } from "./TagTreeFilter"
import { useMemoListFilterState } from "./state"

export type Filter = ListMemosQuery

export interface MemoListFilterProps {
    tags: Tag[]
    filter: Filter
    onChangeFilter: (f: Filter) => void
}

export function MemoListFilter(props: MemoListFilterProps) {
    let { datepicker, onChangeSearch, onSelectDate, onSelectStateFilter } =
        useMemoListFilterState(props)
    let t = useT("components/MemoListFilter")

    let { openOffCanvas } = useTagTreeFilterStore()

    return (
        <div className="memo-list-filter">
            <AppHeader position="right" id="memo-list-filter-search">
                <SearchBar
                    className="collapsible"
                    onChange={onChangeSearch}
                    query={props.filter.query}
                />
                <Button
                    iconRight=<HashIcon />
                    outline
                    className="filter-offcanvas-trigger"
                    onPress={openOffCanvas}
                >
                    <span className="sr-only">
                        {t.ShowTagTreeFilterOffCanvas}
                    </span>
                </Button>
            </AppHeader>

            <div
                className={clsx("collapsibile-date-picker", {
                    expanded: datepicker.expanded,
                })}
            >
                <ShortDayPicker
                    onSelect={onSelectDate}
                    selected={props.filter.exactDate}
                />

                <DatePicker
                    onSelect={onSelectDate}
                    selected={props.filter.exactDate}
                />

                <StateFilter
                    onSelect={onSelectStateFilter}
                    selected={props.filter}
                />

                <Button
                    iconRight={
                        <CaretDownIcon
                            aria-hidden
                            className={clsx({
                                "rotate-180": datepicker.expanded,
                            })}
                        />
                    }
                    ariaLabel="Expand Date Picker"
                    plain
                    size="sm"
                    onPress={() => datepicker.setExpanded(!datepicker.expanded)}
                />
            </div>

            <div className="hidden tablet:block">
                <SearchBar
                    onChange={onChangeSearch}
                    query={props.filter.query}
                />
            </div>

            <DatePicker
                onSelect={onSelectDate}
                selected={props.filter.exactDate}
                className="hidden tablet:block"
            />

            <TagTreeFilter />

            <StateFilter
                className="hidden tablet:grid"
                onSelect={onSelectStateFilter}
                selected={props.filter}
            />
        </div>
    )
}
