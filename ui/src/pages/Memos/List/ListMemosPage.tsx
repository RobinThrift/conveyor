import type { CreateMemoRequest } from "@/api/memos"
import { Editor } from "@/components/Editor"
import { EndOfListMarker } from "@/components/EndOfListMarker"
import { Filters } from "@/components/Filters"
import { Loader } from "@/components/Loader"
import { Memo, type PartialMemoUpdate } from "@/components/Memo"
import { Sheet, SheetContent, SheetTrigger } from "@/components/Sheet"
import type { Tag } from "@/domain/Tag"
import { useIsMobile } from "@/hooks/useIsMobile"
import { useSetting } from "@/storage/settings"
import { Sliders } from "@phosphor-icons/react"
import React, { useCallback, useEffect, useState } from "react"
import { type Filter, useListMemosPageState } from "./state/memos"
import { useTagListStore } from "./state/tags"

export interface ListMemosPageProps {
    filter: Filter
    showEditor?: boolean
    onChangeFilters?: (filter: Filter) => void
}

export function ListMemosPage(props: ListMemosPageProps) {
    let [doubleClickToEdit] = useSetting<boolean, "controls.doubleClickToEdit">(
        "controls.doubleClickToEdit",
    )
    let showEditor = props.showEditor ?? true
    let {
        memos,
        isLoading,
        filter,
        nextPage,
        setFilter,
        createMemo,
        updateMemo,
    } = useListMemosPageState({ filter: props.filter, pageSize: 20 })
    let tagList = useTagListStore()

    let onClickTag = useCallback(
        (tag: string) => {
            setFilter({
                ...filter,
                tag: tag,
            })
        },
        [filter, setFilter],
    )

    useEffect(() => {
        setFilter(props.filter)
    }, [setFilter, props.filter])

    let onEOLReached = useCallback(() => {
        if (!isLoading) {
            nextPage()
        }
    }, [isLoading, nextPage])

    let updateMemoContentCallback = useCallback(
        (update: PartialMemoUpdate) => {
            updateMemo(update, !("content" in update))
        },
        [updateMemo],
    )

    let onChangeFilters = useCallback(
        (filter: Filter) => {
            if (props.onChangeFilters) {
                props.onChangeFilters(filter)
                return
            }

            setFilter(filter)
        },
        [props.onChangeFilters, setFilter],
    )

    return (
        <div className="flex gap-4 justify-center w-full">
            <div className="flex-1 flex flex-col gap-4 w-full max-w-3xl sm:max-w-4xl mx-auto lg:mx-1">
                {showEditor && (
                    <NewMemoEditor
                        tags={tagList.tags}
                        createMemo={createMemo}
                        inProgress={isLoading}
                    />
                )}

                <div className="flex flex-col gap-4 relative">
                    {memos.map((memo) => (
                        <Memo
                            key={memo.id}
                            memo={memo}
                            tags={tagList.tags}
                            onClickTag={onClickTag}
                            updateMemo={updateMemoContentCallback}
                            className="animate-in slide-in-from-bottom fade-in"
                            doubleClickToEdit={doubleClickToEdit}
                        />
                    ))}
                    <EndOfListMarker onReached={onEOLReached} />
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
                    tags={tagList}
                    onChangeFilter={onChangeFilters}
                    className="sm:max-w-[300px] sm:pe-4 md:pe-8 lg:max-w-none lg:w-[300px] lg:pe-0"
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
                <div className="absolute right-0 top-0 z-40">
                    <SheetTrigger asChild>
                        <button type="button" className="p-4">
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
