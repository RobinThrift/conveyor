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
import {
    type Filter,
    useListMemosPageState,
    useMemoListStore,
} from "./state/memos"
import { useTagListStore } from "./state/tags"

export interface ListMemosPageProps {
    filter: Filter
}

export function ListMemosPage(props: ListMemosPageProps) {
    let state = useListMemosPageState({ filter: props.filter })
    let memoList = useMemoListStore()
    let tagList = useTagListStore()

    let onClickTag = useCallback(
        (tag: Tag) => {
            memoList.setParams({
                filter: {
                    ...memoList.params.filter,
                    tag: tag,
                },
            })
        },
        [memoList.params.filter, memoList.setParams],
    )

    let updateMemo = useCallback((memo: MemoT) => {
        console.log("memo", memo)
    }, [])

    let onEOLReached = useCallback(() => {
        if (!memoList.isLoading) {
            memoList.nextPage()
        }
    }, [memoList.isLoading, memoList.nextPage])

    let setFilter = useCallback(
        (filter: Filter) => {
            memoList.setParams({ filter })
        },
        [memoList.setParams],
    )

    let memoCreated =
        state.creating.created &&
        !state.creating.inProgress &&
        !state.creating.error

    // useEffect(() => {
    //     if (memoCreated) {
    //         startTransition(() => {
    //             state.memos.reset()
    //         })
    //     }
    // }, [state.memos.reset, memoCreated])

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
                    {memoList.items.map((memo) => (
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
                    {memoList.isLoading && (
                        <div className="flex justify-center items-center min-h-[200px]">
                            <Loader />
                        </div>
                    )}
                </div>
            </div>

            <FiltersSidebar>
                <Filters
                    filters={memoList.params.filter}
                    tags={tagList}
                    onChangeFilters={setFilter}
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
