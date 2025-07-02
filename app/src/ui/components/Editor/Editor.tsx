import clsx from "clsx"
import React from "react"

import type { AttachmentID } from "@/domain/Attachment"
import type { MemoContentChanges } from "@/domain/Changelog"
import type { Memo } from "@/domain/Memo"
import type { Tag } from "@/domain/Tag"
import { AlertDialog } from "@/ui/components/AlertDialog"
import { Button } from "@/ui/components/Button"
import { ArrowLeftIcon, CheckIcon, XIcon } from "@/ui/components/Icons"
import { useT } from "@/ui/i18n"

import { TextEditor } from "./TextEditor"
import { Toolbar } from "./Toolbar"
import { useEditorState } from "./useEditorState"

export interface EditorProps {
    className?: string

    vimModeEnabled?: boolean

    placeholder: string

    tags: Tag[]
    memo: Memo

    autoFocus?: boolean
    placeCursorAt?: { x: number; y: number; snippet?: string }

    onSave: (memo: Memo, changeset: MemoContentChanges) => void
    onCancel?: () => void

    transferAttachment(attachment: {
        id: AttachmentID
        filename: string
        content: ArrayBufferLike
    }): Promise<void>
}

export function Editor(props: EditorProps) {
    let t = useT("components/Editor")
    let { confirmationDialog, onSave, onCancel, onChange, isChanged, content } =
        useEditorState(props)

    return (
        <article className="@container memo is-editing">
            <div
                className={clsx("editor", props.className, {
                    "is-changed": isChanged,
                })}
            >
                <div className="editor-buttons">
                    {props.onCancel && (
                        <Button
                            onPress={onCancel}
                            variant="danger"
                            plain
                            aria-label={t.Cancel}
                            iconLeft={
                                <>
                                    <XIcon weight="fill" className="hidden tablet:block" />
                                    <ArrowLeftIcon className="tablet:hidden" />
                                </>
                            }
                        >
                            <span className="sr-only tablet:not-sr-only">{t.Cancel}</span>
                        </Button>
                    )}

                    <Button
                        aria-label={t.Save}
                        onPress={onSave}
                        plain
                        iconLeft={<CheckIcon />}
                        isDisabled={!isChanged}
                    >
                        <span className="sr-only tablet:not-sr-only">{t.Save}</span>
                    </Button>
                </div>

                <TextEditor
                    id={props.memo.id}
                    tags={props.tags}
                    content={content()}
                    autoFocus={props.autoFocus}
                    placeholder={props.placeholder}
                    placeCursorAt={props.placeCursorAt}
                    vimModeEnabled={props.vimModeEnabled}
                    onChange={onChange}
                    onCancel={onCancel}
                    onSave={onSave}
                    transferAttachment={props.transferAttachment}
                >
                    {(cmds) => <Toolbar {...cmds} />}
                </TextEditor>

                <AlertDialog
                    open={confirmationDialog.isOpen}
                    onOpenChange={confirmationDialog.setIsOpen}
                >
                    <AlertDialog.Content>
                        <AlertDialog.Title>{t.DiscardChangesTitle}</AlertDialog.Title>

                        <AlertDialog.Description>
                            {t.DiscardChangesDescription}
                        </AlertDialog.Description>

                        <AlertDialog.Buttons>
                            <Button variant="danger" onPress={confirmationDialog.discard}>
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
