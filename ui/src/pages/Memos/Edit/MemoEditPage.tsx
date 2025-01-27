import React, { useCallback, Suspense } from "react"

import { Editor } from "@/components/Editor"
import { Loader } from "@/components/Loader"
import type { Memo, MemoID } from "@/domain/Memo"
import type { Tag } from "@/domain/Tag"

import { useMemoEditPageState } from "./useMemoEditPageState"

export interface MemoEditPageProps {
    memoID: MemoID
    position?: { x: number; y: number; snippet?: string }
}

export function MemoEditPage(props: MemoEditPageProps) {
    let { isLoading, memo, tags, updateMemo, cancelEdit } =
        useMemoEditPageState(props)

    return (
        <div
            className="memo-edit-page"
            style={{
                viewTransitionName: `memo-${props.memoID}`,
            }}
        >
            <Suspense>
                {memo && (
                    <MemoEditor
                        memo={memo}
                        tags={tags}
                        placeCursorAt={props.position}
                        updateMemo={updateMemo}
                        onCancel={cancelEdit}
                    />
                )}
            </Suspense>

            {isLoading && (
                <div className="flex justify-center items-center min-h-[200px]">
                    <Loader />
                </div>
            )}
        </div>
    )
}

function MemoEditor(props: {
    tags: Tag[]
    memo: Memo
    updateMemo: (req: { memo: Memo }) => void
    onCancel: () => void
    placeCursorAt?: { x: number; y: number; snippet?: string }
    overrideKeybindings?: boolean
}) {
    let createMemo = useCallback(
        (memo: Memo) => {
            props.updateMemo({
                memo: {
                    ...memo,
                    content: memo.content.trim(),
                },
            })
        },
        [props.updateMemo],
    )

    return (
        <Editor
            memo={props.memo}
            tags={props.tags}
            onSave={createMemo}
            onCancel={props.onCancel}
            autoFocus={true}
            placeholder=""
            placeCursorAt={props.placeCursorAt}
            overrideKeybindings={props.overrideKeybindings}
        />
    )
}
