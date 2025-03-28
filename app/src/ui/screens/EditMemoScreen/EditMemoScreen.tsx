import React, { useCallback, Suspense } from "react"

import type { AttachmentID } from "@/domain/Attachment"
import type { MemoContentChanges } from "@/domain/Changelog"
import type { Memo, MemoID } from "@/domain/Memo"
import type { Tag } from "@/domain/Tag"
import { Editor } from "@/ui/components/Editor"
import { Loader } from "@/ui/components/Loader"

import {
    type UpdateMemoRequest,
    useEditMemoScreenState,
} from "./useEditMemoScreenState"

export interface EditMemoScreenProps {
    memoID: MemoID
    position?: { x: number; y: number; snippet?: string }
}

export function EditMemoScreen(props: EditMemoScreenProps) {
    let {
        isLoading,
        memo,
        tags,
        updateMemo,
        cancelEdit,
        transferAttachment,
        settings,
    } = useEditMemoScreenState(props)

    return (
        <div
            className="edit-memo-screen"
            style={{
                viewTransitionName: `memo-${props.memoID}`,
            }}
        >
            <Suspense>
                {memo && (
                    <MemoEditor
                        memo={memo}
                        tags={tags}
                        settings={settings}
                        placeCursorAt={props.position}
                        updateMemo={updateMemo}
                        onCancel={cancelEdit}
                        transferAttachment={transferAttachment}
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
    placeCursorAt?: { x: number; y: number; snippet?: string }
    overrideKeybindings?: boolean
    updateMemo: (req: { memo: UpdateMemoRequest }) => void
    onCancel: () => void
    settings: {
        vimModeEnabled: boolean
    }
    transferAttachment(attachment: {
        id: AttachmentID
        filename: string
        content: ArrayBufferLike
    }): Promise<void>
}) {
    let onSave = useCallback(
        (memo: Memo, changeset: MemoContentChanges) => {
            props.updateMemo({
                memo: {
                    ...memo,
                    content: {
                        content: memo.content.trim(),
                        changes: changeset,
                    },
                },
            })
        },
        [props.updateMemo],
    )

    return (
        <Editor
            memo={props.memo}
            tags={props.tags}
            autoFocus={true}
            placeholder=""
            placeCursorAt={props.placeCursorAt}
            onSave={onSave}
            onCancel={props.onCancel}
            transferAttachment={props.transferAttachment}
            vimModeEnabled={props.settings.vimModeEnabled}
        />
    )
}
