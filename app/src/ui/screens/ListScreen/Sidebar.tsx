import React, { useCallback } from "react"

import { ErrorBoundary } from "@/ui/components/ErrorBoundary"
import { NotePencilIcon } from "@/ui/components/Icons"
import { DatePicker } from "@/ui/components/MemoListFilter/DatePicker"
import { SearchBar } from "@/ui/components/MemoListFilter/Searchbar"
import { StateFilter } from "@/ui/components/MemoListFilter/StateFilter"
import { TagTreeFilter } from "@/ui/components/MemoListFilter/TagTreeFilter"
import { TopBar } from "@/ui/components/TopBar"
import { useIsMobile } from "@/ui/hooks/useIsMobile"
import { useT } from "@/ui/i18n"
import { getScrollOffsetTop } from "@/ui/navigation"
import { actions } from "@/ui/stores"

import { SettingsLink } from "./SettingsLink"
import { TabList } from "./TabList"

export function Sidebar() {
    let t = useT("components/Sidebar")
    let isMobile = useIsMobile()

    return (
        <div className="memo-list-sidebar">
            <ErrorBoundary resetOn={[]}>
                <div className="memo-list-sidebar-header">
                    <div className="memo-list-sidebar-header-search-bar">
                        <TopBar>
                            <SettingsLink />
                        </TopBar>

                        <SearchBar />
                    </div>

                    <DatePicker />
                </div>

                <TabList />

                <NewMemoButton />

                <hr />

                <h2 className="memo-list-sidebar-title mt-2">{t.Tags}</h2>

                {!isMobile && <TagTreeFilter />}

                <StateFilter />
            </ErrorBoundary>
        </div>
    )
}

function NewMemoButton() {
    let t = useT("components/Sidebar")

    let onClick = useCallback(() => {
        let memo = actions.memos.new()
        actions.ui.openMemo(memo.id, getScrollOffsetTop())
    }, [])

    return (
        <button type="button" className="memo-list-sidebar-new-memo-btn" onClick={onClick}>
            <NotePencilIcon aria-hidden="true" />
            {t.NewMemo}
        </button>
    )
}
