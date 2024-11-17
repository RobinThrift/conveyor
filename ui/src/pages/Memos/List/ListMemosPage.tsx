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
import React, { startTransition, useCallback, useEffect, useState } from "react"
import { type Filter, useListMemosPageState, useTagListStore } from "./state"

export interface ListMemosPageProps {
    filter: Filter
}

export function ListMemosPage(props: ListMemosPageProps) {
    let state = useListMemosPageState({ filter: props.filter })
    let tagList = useTagListStore()

    let onClickTag = useCallback(
        (tag: Tag) => {
            state.setFilter({
                ...state.filter,
                tag: tag,
            })
        },
        [state.setFilter, state.filter],
    )

    let updateMemo = useCallback((memo: MemoT) => {
        console.log("memo", memo)
    }, [])

    let onEOLReached = useCallback(() => {
        if (!state.memos.isLoading) {
            state.memos.nextPage()
        }
    }, [state.memos.isLoading, state.memos.nextPage])

    let memoCreated =
        state.creating.created &&
        !state.creating.inProgress &&
        !state.creating.error

    useEffect(() => {
        if (memoCreated) {
            startTransition(() => {
                state.memos.reset()
            })
        }
    }, [state.memos.reset, memoCreated])

    return (
        <div className="flex gap-4 justify-center">
            <div className="flex-1 max-w-4xl gap-4 flex flex-col">
                <div className="container mx-auto">
                    <NewMemoEditor
                        tags={tagList.tags}
                        createMemo={state.createMemo}
                        memoCreated={memoCreated || false}
                    />
                </div>

                <div className="gap-4 flex flex-col relative">
                    {state.memos.memos.map((memo) => (
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
                    {state.memos.isLoading && (
                        <div className="flex justify-center items-center min-h-[200px]">
                            <Loader />
                        </div>
                    )}
                </div>
            </div>

            <FiltersSidebar>
                <Filters
                    filters={state.filter}
                    tags={tagList}
                    onChangeFilters={state.setFilter}
                />
            </FiltersSidebar>
        </div>
    )
}

function NewMemoEditor(props: {
    tags: Tag[]
    createMemo: (memo: CreateMemoRequest) => void
    memoCreated: boolean
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
        createdAt: new Date(),
        updatedAt: new Date(),
    })

    useEffect(() => {
        if (props.memoCreated) {
            setNewMemo({
                id: Date.now().toString(),
                name: "",
                content: "",
                isArchived: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
        }
    }, [props.memoCreated])

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
