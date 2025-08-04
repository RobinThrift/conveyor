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
import { useMemoListFilterState } from "./state"
import { TagTreeFilter, useTagTreeFilterStore } from "./TagTreeFilter"

export function MemoListFilter() {
    let { datepicker } = useMemoListFilterState()
    let t = useT("components/MemoListFilter")

    let { openOffCanvas } = useTagTreeFilterStore()

    return (
        <div className="memo-list-filter">
            <AppHeader position="right" id="memo-list-filter-search">
                <SearchBar className="collapsible" />
                <Button
                    iconRight=<HashIcon />
                    outline
                    className="filter-offcanvas-trigger"
                    onPress={openOffCanvas}
                >
                    <span className="sr-only">{t.ShowTagTreeFilterOffCanvas}</span>
                </Button>
            </AppHeader>

            <div
                className={clsx("collapsibile-date-picker", {
                    expanded: datepicker.expanded,
                })}
            >
                <ShortDayPicker />

                <DatePicker />

                <StateFilter />

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
                <SearchBar />
            </div>

            <TagTreeFilter />

            <div className="overflow-blur" />

            <DatePicker className="hidden tablet:block" />

            <StateFilter className="hidden tablet:grid" />
        </div>
    )
}
