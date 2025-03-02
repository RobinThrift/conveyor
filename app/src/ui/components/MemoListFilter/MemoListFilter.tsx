import type { ListMemosQuery } from "@/domain/Memo"
import type { Tag } from "@/domain/Tag"
import { CaretDown, Hash } from "@phosphor-icons/react"
import clsx from "clsx"
import React from "react"

import { Button } from "@/ui/components/Button"
import { GearIcon } from "@/ui/components/Icons"
import { LinkButton } from "@/ui/components/Link"
import { OffCanvas } from "@/ui/components/OffCanvas"
import { useT } from "@/ui/i18n"

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
        datepicker,
        onChangeSearch,
        onSelectDate,
        onSelectTag,
        onSelectStateFilter,
    } = useMemoListFilterState(props)
    let t = useT("components/MemoListFilter")
    let tNav = useT("components/Navigation")

    return (
        <div className="memo-list-filter">
            <div className="flex gap-1 px-2 py-2">
                <OffCanvas modal={true}>
                    <OffCanvas.Trigger
                        iconRight=<Hash />
                        plain
                        className="filter-offcanvas-trigger"
                    >
                        <span className="sr-only">{t.TriggerLabel}</span>
                    </OffCanvas.Trigger>
                    <OffCanvas.Content className="filter-offcanvas">
                        <OffCanvas.Title>{t.OffScreenTitle}</OffCanvas.Title>
                        <OffCanvas.Description className="sr-only">
                            {t.OffScreenDescription}
                        </OffCanvas.Description>
                        <TagTree
                            tags={props.tags}
                            onSelect={onSelectTag}
                            selected={props.filter.tag}
                        />

                        <StateFilter
                            onSelect={onSelectStateFilter}
                            selected={props.filter}
                        />

                        <nav>
                            <LinkButton
                                href="/settings/interface"
                                iconLeft={<GearIcon />}
                                plain
                                size="sm"
                            >
                                {tNav.Settings}
                            </LinkButton>
                        </nav>
                    </OffCanvas.Content>
                </OffCanvas>
                <SearchBar onChange={onChangeSearch} />
            </div>

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
                        <CaretDown
                            className={clsx({
                                "rotate-180": datepicker.expanded,
                            })}
                        />
                    }
                    ariaLabel="Expand Date Picker"
                    plain
                    size="sm"
                    onClick={() => datepicker.setExpanded(!datepicker.expanded)}
                />
            </div>

            <DatePicker
                onSelect={onSelectDate}
                selected={props.filter.exactDate}
                className="hidden tablet:block"
            />

            <TagTree
                tags={props.tags}
                onSelect={onSelectTag}
                selected={props.filter.tag}
                className="hidden tablet:block"
            />

            <StateFilter
                onSelect={onSelectStateFilter}
                selected={props.filter}
                className="hidden tablet:grid"
            />
        </div>
    )
}
