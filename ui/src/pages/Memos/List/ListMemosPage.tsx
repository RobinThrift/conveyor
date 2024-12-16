import { DateTime } from "@/components/DateTime"
import { Editor } from "@/components/Editor"
import { EndOfListMarker } from "@/components/EndOfListMarker"
import { Filters } from "@/components/Filters"
import { Loader } from "@/components/Loader"
import { Memo, type PartialMemoUpdate } from "@/components/Memo"
import { Sheet, SheetContent, SheetTrigger } from "@/components/Sheet"
import type { Tag } from "@/domain/Tag"
import { useIsMobile } from "@/hooks/useIsMobile"
import { useT } from "@/i18n"
import { useSetting } from "@/state/settings"
import { Sliders } from "@phosphor-icons/react"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
    type CreateMemoRequest,
    type Filter,
    useListMemosPageState,
} from "./state"

export interface ListMemosPageProps {
    filter: Filter
    showEditor?: boolean
    onChangeFilters?: (filter: Filter) => void
}

export function ListMemosPage(props: ListMemosPageProps) {
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

    let onClickTag = useCallback(
        (tag: string) => {
            actions.setFilter({
                ...filter,
                tag: tag,
            })
        },
        [filter, actions.setFilter],
    )

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
                    {memos.map((memo) => (
                        <Memo
                            key={memo.id}
                            memo={memo}
                            tags={tags}
                            actions={{
                                edit: !filter.isArchived && !filter.isDeleted,
                            }}
                            onClickTag={onClickTag}
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
            onClickTag,
            updateMemoContentCallback,
            doubleClickToEdit,
        ],
    )

    return (
        <div className="memos-list-page pt-12 tablet:pt-0">
            <div className="grouped-memos-list">
                {showEditor && (
                    <NewMemoEditor
                        tags={tags}
                        createMemo={actions.createMemo}
                        inProgress={isLoading}
                    />
                )}

                <div className="flex flex-col gap-4 relative py-4">
                    {memoComponents}
                    {!isLoading && <EndOfListMarker onReached={onEOLReached} />}

                    {isLoading && (
                        <div className="flex justify-center items-center min-h-[200px]">
                            <Loader />
                        </div>
                    )}
                </div>
            </div>

            <FiltersSidebar>
                <Filters
                    filters={filter}
                    tags={{
                        tags,
                        isLoading: isLoadingTags,
                        nextPage: actions.loadNextTagsPage,
                    }}
                    onChangeFilter={onChangeFilters}
                    className="filters-sidebar"
                />
            </FiltersSidebar>
        </div>
    )
}

function NewMemoEditor(props: {
    tags: Tag[]
    createMemo: (memo: CreateMemoRequest) => void
    inProgress: boolean
}) {
    let createMemo = useCallback(
        (memo: CreateMemoRequest) => {
            memo.content = memo.content.trim()
            if (memo.content === "") {
                return
            }

            props.createMemo(memo)
        },
        [props.createMemo],
    )

    let [newMemo, setNewMemo] = useState({
        id: Date.now().toString(),
        name: "",
        content: "",
        isArchived: false,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    })

    useEffect(() => {
        if (!props.inProgress) {
            setNewMemo({
                id: Date.now().toString(),
                name: "",
                content: "",
                isArchived: false,
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
        }
    }, [props.inProgress])

    return (
        <Editor
            memo={newMemo}
            tags={props.tags}
            onSave={createMemo}
            placholder="Belt out a memo..."
            autoFocus={true}
        />
    )
}

function FiltersSidebar(props: React.PropsWithChildren) {
    let isMobile = useIsMobile()

    if (isMobile) {
        return (
            <Sheet>
                <div className="absolute right-2 top-2 z-40">
                    <SheetTrigger asChild>
                        <button
                            type="button"
                            className="p-2 bg-navigation-bg text-navigation-fg rounded-full"
                        >
                            <Sliders />
                        </button>
                    </SheetTrigger>
                </div>

                <SheetContent
                    title="Filters"
                    titleClassName="sr-only"
                    side="right"
                >
                    <div className="bg-body p-3 h-full overflow-auto relative">
                        {props.children}
                    </div>
                </SheetContent>
            </Sheet>
        )
    }

    return props.children
}

function DayHeader({ date, diffToToday }: { date: Date; diffToToday: number }) {
    let t = useT("pages/ListMemos")
    let prefix = ""
    if (diffToToday < 1) {
        prefix = t.DayToday
    } else if (diffToToday <= 2) {
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
