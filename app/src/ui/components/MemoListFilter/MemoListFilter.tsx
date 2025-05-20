import type { ListMemosQuery } from "@/domain/Memo"
import type { Tag } from "@/domain/Tag"
import clsx from "clsx"
import React from "react"

import { Button } from "@/ui/components/Button"
import { CaretDownIcon, HashIcon, SlidersIcon } from "@/ui/components/Icons"
import { LinkButton } from "@/ui/components/Link"
import { OffCanvas } from "@/ui/components/OffCanvas"
import { useT } from "@/ui/i18n"

import { AppHeader } from "../AppHeader"
import { DatePicker } from "./DatePicker"
import { SearchBar } from "./Searchbar"
import { ShortDayPicker } from "./ShortDayPicker"
import { StateFilter } from "./StateFilter"
import { TagTree } from "./TagTree"
import { useMemoListFilterState } from "./state"

export type Filter = ListMemosQuery

export interface MemoListFilterProps {
    tags: Tag[]
    filter: Filter
    onChangeFilter: (f: Filter) => void
}

export function MemoListFilter(props: MemoListFilterProps) {
    let {
        tagTreeState,
        datepicker,
        onChangeSearch,
        onSelectDate,
        onSelectStateFilter,
    } = useMemoListFilterState(props)
    let t = useT("components/MemoListFilter")
    let tAppHeader = useT("components/AppHeader")

    return (
        <div className="memo-list-filter">
            <AppHeader position="left" id="memo-list-filter-tag-tree">
                <div className="flex items-center">
                    <OffCanvas aria-lable={t.OffScreenDescription}>
                        <Button
                            iconRight=<HashIcon />
                            outline
                            className="filter-offcanvas-trigger"
                        >
                            <span className="sr-only">{t.TriggerLabel}</span>
                        </Button>
                        <OffCanvas.Content className="filter-offcanvas">
                            <OffCanvas.Title>
                                {t.OffScreenTitle}
                            </OffCanvas.Title>
                            <TagTree {...tagTreeState} tags={props.tags} />

                            <StateFilter
                                onSelect={onSelectStateFilter}
                                selected={props.filter}
                            />

                            <nav>
                                <LinkButton
                                    screen="settings"
                                    iconLeft={<SlidersIcon />}
                                    plain
                                    size="sm"
                                    openInNewStack
                                >
                                    {tAppHeader.Settings}
                                </LinkButton>
                            </nav>
                        </OffCanvas.Content>
                    </OffCanvas>
                </div>
            </AppHeader>

            <AppHeader position="right" id="memo-list-filter-search">
                <SearchBar
                    className="collapsible"
                    onChange={onChangeSearch}
                    query={props.filter.query}
                />
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

                <Button
                    iconRight={
                        <CaretDownIcon
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

            <TagTree {...tagTreeState} tags={props.tags} />

            <StateFilter
                onSelect={onSelectStateFilter}
                selected={props.filter}
            />
        </div>
    )
}
