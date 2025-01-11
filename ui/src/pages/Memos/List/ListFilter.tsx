import { Button } from "@/components/Button"
import { Popover } from "@/components/Popover"
import type { ListMemosQuery } from "@/domain/Memo"
import type { Tag } from "@/domain/Tag"
import { CaretDown, Hash } from "@phosphor-icons/react"
import clsx from "clsx"
import React, { useCallback, useState } from "react"
import { DatePicker } from "./DatePicker"
import { SearchBar } from "./Searchbar"
import { ShortDayPicker } from "./ShortDayPicker"
import { Tags } from "./Tags"

export type Filter = ListMemosQuery

export interface ListFilterProps {
    tags: { tags: Tag[]; isLoading: boolean; nextPage: () => void }
    filter: Filter
    onChangeFilter: (f: Filter) => void
}

export function ListFilter(props: ListFilterProps) {
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

    return (
        <div className="list-filter">
            <div className="flex gap-1 px-2 py-2">
                <SearchBar onChange={onChangeSearch} />
                <Popover modal={true}>
                    <Popover.Trigger
                        iconRight=<Hash />
                        plain
                        className="tablet:hidden"
                    />
                    <Popover.Content
                        align="end"
                        alignOffset={10}
                        withCloseButton={false}
                    >
                        <Tags
                            tags={props.tags.tags}
                            onSelect={onSelectTag}
                            selected={props.filter.tag}
                        />
                    </Popover.Content>
                </Popover>
            </div>

            <div
                className={clsx("collapsibile-date-picker", {
                    expanded: collapsibileDatePickerExpaned,
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
                                "rotate-180": collapsibileDatePickerExpaned,
                            })}
                        />
                    }
                    ariaLabel="Expand Date Picker"
                    plain
                    size="sm"
                    onClick={() =>
                        setCollapsibileDatePickerExpaned(
                            !collapsibileDatePickerExpaned,
                        )
                    }
                />
            </div>

            <DatePicker
                onSelect={onSelectDate}
                selected={props.filter.exactDate}
                className="hidden tablet:block"
            />

            <Tags
                tags={props.tags.tags}
                onSelect={onSelectTag}
                selected={props.filter.tag}
                className="hidden tablet:block"
            />
        </div>
    )
}
