import type { CreateMemoRequest } from "@/api/memos"
import { Editor } from "@/components/Editor"
import { EndOfListMarker } from "@/components/EndOfListMarker"
import { Filters } from "@/components/Filters"
import { Loader } from "@/components/Loader"
import { Memo } from "@/components/Memo"
import { Sheet, SheetContent, SheetTrigger } from "@/components/Sheet"
import type { Memo as MemoT } from "@/domain/Memo"
import type { Tag } from "@/domain/Tag"
import { useIsMobile } from "@/hooks/useIsMobile"
import { Sliders } from "@phosphor-icons/react"
import React, { useCallback, useEffect, useState } from "react"
import { type Filter, useListMemosPageState } from "./state/memos"
import { useTagListStore } from "./state/tags"

export interface ListMemosPageProps {
    filter: Filter
    onChangeFilters?: (filter: Filter) => void
}

export function ListMemosPage(props: ListMemosPageProps) {
    let {
        memos,
        isLoading,
        filter,
        nextPage,
        setFilter,
        createMemo,
        updateMemo: updateMemoExec,
        createMemoInProgress,
    } = useListMemosPageState({ filter: props.filter })
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

    let updateMemo = useCallback(
        (memo: MemoT) => {
            updateMemoExec({ memo })
        },
        [updateMemoExec],
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
        <div className="flex gap-4 justify-center">
            <div className="flex-1 max-w-4xl gap-4 flex flex-col">
                <div className="container mx-auto">
                    <NewMemoEditor
                        tags={tagList.tags}
                        createMemo={createMemo}
                        inProgress={createMemoInProgress}
                    />
                </div>

                <div className="gap-4 flex flex-col relative">
                    {memos.map((memo) => (
                        <Memo
                            key={memo.id}
                            memo={memo}
                            tags={tagList.tags}
                            onClickTag={onClickTag}
                            updateMemo={updateMemo}
                            className="animate-in slide-in-from-bottom fade-in"
                            doubleClickToEdit={true}
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
                />
            </FiltersSidebar>
        </div>
    )
}

function NewMemoEditor(props: {
    tags: Tag[]
    createMemo: (req: { memo: CreateMemoRequest }) => void
    inProgress: boolean
}) {
    let createMemo = useCallback(
        (memo: CreateMemoRequest) => {
            memo.content = memo.content.trim()
            if (memo.content === "") {
                return
            }

            props.createMemo({ memo })
        },
        [props.createMemo],
    )

    let [newMemo, setNewMemo] = useState({
        id: Date.now().toString(),
        name: "",
        content: "",
        isArchived: false,
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

                <SheetContent title="Filters" side="right">
                    <div className="bg-body p-3 h-full overflow-auto relative">
                        {props.children}
                    </div>
                </SheetContent>
            </Sheet>
        )
    }

    return props.children
}
