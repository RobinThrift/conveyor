import clsx from "clsx"
import React from "react"

import type { AttachmentID } from "@/domain/Attachment"
import type { MemoContentChanges } from "@/domain/Changelog"
import type { Memo } from "@/domain/Memo"
import type { Tag } from "@/domain/Tag"
import { AlertDialog } from "@/ui/components/AlertDialog"
import { Button } from "@/ui/components/Button"
import { CheckIcon, XIcon } from "@/ui/components/Icons"
import { useT } from "@/ui/i18n"

import { EditorToolbar } from "./EditorToolbar"
import { TextEditor } from "./TextEditor"
import { useEditorState } from "./useEditorState"

export interface EditorProps {
    className?: string

    vimModeEnabled?: boolean

    tags: Tag[]
    memo: Memo

    autoFocus?: boolean
    placeCursorAt?: { x: number; y: number; snippet?: string }

    onSave: (memo: Memo, changeset: MemoContentChanges) => void
    onCancel?: () => void

    transferAttachment(attachment: {
        id: AttachmentID
        filename: string
        data: Uint8Array
    }): Promise<void>
}

export function Editor(props: EditorProps) {
    let t = useT("components/Editor")
    let { confirmationDialog, onSave, onCancel, onChange, isChanged, content } =
        useEditorState(props)

    return (
        <article className="memo is-editing">
            <div
                className={clsx("editor", props.className, {
                    "is-changed": isChanged,
                })}
            >
                <div className="editor-buttons">
                    {props.onCancel && (
                        <Button onClick={onCancel} variant="danger" iconLeft={<XIcon />}>
                            <span className="sr-only tablet:not-sr-only">{t.Cancel}</span>
                        </Button>
                    )}

                    <Button
                        aria-label={t.Save}
                        onClick={onSave}
                        iconLeft={<CheckIcon />}
                        disabled={!isChanged}
                    >
                        <span className="sr-only tablet:not-sr-only">{t.Save}</span>
                    </Button>
                </div>

                <TextEditor
                    id={props.memo.id}
                    tags={props.tags}
                    content={content()}
                    autoFocus={props.autoFocus}
                    placeCursorAt={props.placeCursorAt}
                    vimModeEnabled={props.vimModeEnabled}
                    onChange={onChange}
                    onCancel={onCancel}
                    onSave={onSave}
                    transferAttachment={props.transferAttachment}
                >
                    {(cmds) => <EditorToolbar {...cmds} />}
                </TextEditor>

                <AlertDialog
                    open={confirmationDialog.isOpen}
                    onClose={() => confirmationDialog.setIsOpen(false)}
                >
                    <AlertDialog.Content>
                        <AlertDialog.Title>{t.DiscardChangesTitle}</AlertDialog.Title>

                        <AlertDialog.Description>
                            {t.DiscardChangesDescription}
                        </AlertDialog.Description>

                        <AlertDialog.Buttons>
                            <Button variant="danger" onClick={confirmationDialog.discard}>
                                {t.DiscardChangesConfirmation}
                            </Button>
                            <AlertDialog.CancelButton>{t.Cancel}</AlertDialog.CancelButton>
                        </AlertDialog.Buttons>
                    </AlertDialog.Content>
                </AlertDialog>
            </div>
        </article>
    )
}
