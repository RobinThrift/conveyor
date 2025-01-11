import { Dialog } from "@/components/Dialog"
import { Editor } from "@/components/Editor"
import type { Tag } from "@/domain/Tag"
import { Plus } from "@phosphor-icons/react/dist/ssr"
import React, { useCallback, useEffect, useState } from "react"
import type { CreateMemoRequest } from "./state"

export interface NewMemoEditorProps {
    tags: Tag[]
    createMemo: (memo: CreateMemoRequest) => void
    inProgress: boolean
}

export function NewMemoEditor(props: NewMemoEditorProps) {
    let [newMemoEditorDialogOpen, setNewMemoEditorDialogOpen] = useState(false)

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
        <>
            <div className="hidden tablet:block">
                <Editor
                    memo={newMemo}
                    tags={props.tags}
                    onSave={createMemo}
                    placeholder="Belt out a memo..."
                    lazy={false}
                    className="new-memo-editor"
                    buttonPosition="top"
                />
            </div>

            <Dialog
                dismissible={false}
                open={newMemoEditorDialogOpen}
                onOpenChange={setNewMemoEditorDialogOpen}
                modal={true}
            >
                <Dialog.Trigger
                    className="new-memo-editor-fab"
                    iconRight={<Plus />}
                    ariaLabel="New Memo"
                    variant="primary"
                />

                <Dialog.Title className="sr-only">New Memo</Dialog.Title>

                <Dialog.Description className="sr-only">
                    New Memo
                </Dialog.Description>

                <Dialog.Content
                    className="memo-editor-dialog"
                    withCloseButton={false}
                >
                    <Editor
                        memo={newMemo}
                        tags={props.tags}
                        onSave={createMemo}
                        placeholder="Belt out a memo..."
                        autoFocus={true}
                        lazy={false}
                        className="new-memo-editor"
                        onCancel={() => {
                            setNewMemoEditorDialogOpen(false)
                        }}
                    />
                </Dialog.Content>
            </Dialog>
        </>
    )
}
