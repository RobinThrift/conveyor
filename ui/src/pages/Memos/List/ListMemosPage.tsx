import { DateTime } from "@/components/DateTime"
import { EndOfListMarker } from "@/components/EndOfListMarker"
import { Loader } from "@/components/Loader"
import { Memo, type PartialMemoUpdate } from "@/components/Memo"
import { Select } from "@/components/Select"
import { useT } from "@/i18n"
import { useAccountDisplayName } from "@/state/account"
import { useSetting } from "@/state/settings"
import { List, Table } from "@phosphor-icons/react"
import React, { useCallback, useEffect, useMemo } from "react"
import { ListFilter } from "./ListFilter"
import { NewMemoEditor } from "./NewMemoEditor"
import { type Filter, useListMemosPageState } from "./state"

export interface ListMemosPageProps {
    filter: Filter
    showEditor?: boolean
    onChangeFilters?: (filter: Filter) => void
}

export function ListMemosPage(props: ListMemosPageProps) {
    let t = useT("pages/ListMemos")
    let [listLayout, setListLayout] = useSetting("theme.listLayout")
    let [doubleClickToEdit] = useSetting("controls.doubleClickToEdit")
    let showEditor = props.showEditor ?? true
    let {
        state: { memos, isLoading, filter, tags, isLoadingTags },
        actions,
    } = useListMemosPageState()

    useEffect(() => {
        if (Object.keys(props.filter).length) {
            actions.setFilter(props.filter)
        } else {
            actions.loadPage()
        }
        actions.loadTags()
    }, [actions.setFilter, actions.loadPage, actions.loadTags, props.filter])

    let onEOLReached = useCallback(() => {
        if (!isLoading) {
            actions.loadNextPage()
        }
    }, [isLoading, actions.loadNextPage])

    let updateMemoContentCallback = useCallback(
        (update: PartialMemoUpdate) => {
            actions.updateMemo(update, !("content" in update))
        },
        [actions.updateMemo],
    )

    let onChangeFilters = useCallback(
        (filter: Filter) => {
            if (props.onChangeFilters) {
                props.onChangeFilters(filter)
                return
            }

            actions.setFilter(filter)
        },
        [props.onChangeFilters, actions.setFilter],
    )

    let memoComponents = useMemo(
        () =>
            Object.entries(memos).map(([day, { memos, date, diffToToday }]) => (
                <div key={day} className="memos-list">
                    <DayHeader date={date} diffToToday={diffToToday} />
                    <hr className="memos-list-day-divider" />
                    {memos.map((memo) => (
                        <Memo
                            key={memo.id}
                            memo={memo}
                            tags={tags}
                            actions={{
                                edit: !filter.isArchived && !filter.isDeleted,
                            }}
                            firstHeadingIsLink
                            collapsible={listLayout === "masonry"}
                            updateMemo={updateMemoContentCallback}
                            doubleClickToEdit={doubleClickToEdit}
                            className="animate-in slide-in-from-bottom fade-in"
                            viewTransitionName={`memo-${memo.id}`}
                        />
                    ))}
                </div>
            )),
        [
            memos,
            filter,
            tags,
            updateMemoContentCallback,
            doubleClickToEdit,
            listLayout,
        ],
    )

    return (
        <div className={`memos-list-page list-layout-${listLayout}`}>
            <ListFilter
                filter={filter}
                tags={{
                    tags,
                    isLoading: isLoadingTags,
                    nextPage: actions.loadNextTagsPage,
                }}
                onChangeFilter={onChangeFilters}
            />

            <div className="grouped-memos-list">
                <Header filter={filter} />

                {showEditor && (
                    <NewMemoEditor
                        tags={tags}
                        createMemo={actions.createMemo}
                        inProgress={isLoading}
                    />
                )}

                <div className="list-layout-select">
                    <Select
                        name="select-layout"
                        ariaLabel={t.LayoutSelectLabel}
                        value={listLayout}
                        onChange={setListLayout}
                    >
                        <Select.Option value="masonry">
                            <div className="flex gap-1 items-center">
                                <List />
                                <span className="option-label">
                                    {t.LayoutMasonry}
                                </span>
                            </div>
                        </Select.Option>
                        <Select.Option value="single">
                            <div className="flex gap-1 items-center">
                                <Table />
                                <span className="option-label">
                                    {t.LayoutSingle}
                                </span>
                            </div>
                        </Select.Option>
                        <Select.Option value="ultra-compact">
                            <div className="flex gap-1 items-center">
                                <Table />
                                <span className="option-label">
                                    {t.LayoutUltraCompact}
                                </span>
                            </div>
                        </Select.Option>
                    </Select>
                </div>

                <div className="flex flex-col gap-4 py-4">
                    {memoComponents}
                    {!isLoading && <EndOfListMarker onReached={onEOLReached} />}

                    {isLoading && (
                        <div className="flex justify-center items-center min-h-[200px]">
                            <Loader />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function DayHeader({ date, diffToToday }: { date: Date; diffToToday: number }) {
    let t = useT("pages/ListMemos")
    let prefix = ""
    if (diffToToday < 1) {
        prefix = t.DayToday
    } else if (diffToToday === 1) {
        prefix = t.DayYesterday
    }

    if (prefix) {
        return (
            <h2 className="memos-list-day">
                {prefix}
                <span className="named-day-date">
                    (
                    <DateTime date={date} opts={{ dateStyle: "medium" }} />)
                </span>
            </h2>
        )
    }

    return (
        <h2 className="memos-list-day">
            {prefix} <DateTime date={date} opts={{ dateStyle: "medium" }} />
        </h2>
    )
}

function Header({ filter }: { filter: Filter }) {
    let t = useT("pages/ListMemos/Header")

    if (!filter) {
        return (
            <header className="list-header">
                <Greeting key="greeting" />
            </header>
        )
    }

    let children: React.ReactNode[] = []

    if (filter.isDeleted) {
        children.push(t.Deleted, <br />)
    }

    if (filter.isArchived) {
        children.push(t.Archived, <br />)
    }

    if (filter.tag) {
        children.push(t.MemosForTag, <em key="tag">{`#${filter.tag}`}</em>)
    }

    if (filter.exactDate) {
        children.push(
            children.length === 0
                ? t.MemosForExactDateStandalone
                : t.MemosForExactDate,
            <em key="exactDate">
                <DateTime
                    date={filter.exactDate}
                    opts={{ dateStyle: "medium" }}
                />
            </em>,
        )
    }

    if (filter.query) {
        children.push(
            children.length === 0 ? t.MemosForQueryStandalone : t.MemosForQuery,
            <em key="query">{`"${filter.query}"`}</em>,
        )
    }

    if (children.length === 0) {
        children = [<Greeting key="greeting" />]
    }

    return <header className="list-header">{children}</header>
}

function Greeting() {
    let t = useT("pages/ListMemos/Greeting")
    let displayName = useAccountDisplayName()
    let greeting = useMemo(() => {
        let now = new Date()
        if (now.getHours() < 12) {
            return t.Morning
        }

        if (now.getHours() < 18) {
            return t.Afternoon
        }

        return t.Evening
    }, [t.Morning, t.Evening, t.Afternoon])

    return (
        <div className="greeting">
            {greeting}
            <em>{displayName}</em>
        </div>
    )
}
