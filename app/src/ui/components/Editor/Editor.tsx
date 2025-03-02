import clsx from "clsx"
import React, { useEffect, useRef } from "react"

import type { AttachmentID } from "@/domain/Attachment"
import type { MemoContentChanges } from "@/domain/Changelog"
import type { Memo } from "@/domain/Memo"
import type { Tag } from "@/domain/Tag"
import { AlertDialog } from "@/ui/components/AlertDialog"
import { Button } from "@/ui/components/Button"
import { ArrowLeftIcon, CheckIcon, XIcon } from "@/ui/components/Icons"
import { useT } from "@/ui/i18n"

import { TextEditor } from "./TextEditor"
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

    let isScrolling = useRef<
        ReturnType<typeof requestAnimationFrame> | undefined
    >(undefined)

    useEffect(() => {
        document.documentElement.style.setProperty(
            "--visualviewport-height",
            `${window.visualViewport?.height}px`,
        )

        document.documentElement.style.setProperty(
            "--visualviewport-offset-top",
            `${window.visualViewport?.offsetTop}px`,
        )

        let onresize = () => {
            document.documentElement.style.setProperty(
                "--visualviewport-height",
                `${Math.ceil(window.visualViewport?.height ?? 0)}px`,
            )
        }

        let onscroll = () => {
            if (isScrolling.current) {
                cancelAnimationFrame(isScrolling.current)
            }

            isScrolling.current = requestAnimationFrame(() => {
                document.documentElement.style.setProperty(
                    "--visualviewport-offset-top",
                    `${document.documentElement.scrollTop}px`,
                )
            })
        }

        window.visualViewport?.addEventListener("resize", onresize)
        window.visualViewport?.addEventListener("scroll", onscroll)

        return () => {
            window.visualViewport?.removeEventListener("resize", onresize)
            window.visualViewport?.removeEventListener("scrollend", onscroll)
        }
    }, [])

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
                            onClick={onCancel}
                            variant="danger"
                            plain
                            aria-label={t.Cancel}
                            iconLeft={
                                <>
                                    <XIcon
                                        weight="fill"
                                        className="hidden tablet:block"
                                    />
                                    <ArrowLeftIcon className="tablet:hidden" />
                                </>
                            }
                        >
                            <span className="sr-only tablet:not-sr-only">
                                {t.Cancel}
                            </span>
                        </Button>
                    )}

                    <Button
                        aria-label={t.Save}
                        onClick={onSave}
                        plain
                        iconLeft={<CheckIcon />}
                        disabled={!isChanged}
                    >
                        <span className="sr-only tablet:not-sr-only">
                            {t.Save}
                        </span>
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
                />

                <AlertDialog
                    open={confirmationDialog.isOpen}
                    onOpenChange={confirmationDialog.setIsOpen}
                >
                    <AlertDialog.Content>
                        <AlertDialog.Title>
                            {t.DiscardChangesTitle}
                        </AlertDialog.Title>

                        <AlertDialog.Description>
                            {t.DiscardChangesDescription}
                        </AlertDialog.Description>

                        <AlertDialog.Buttons>
                            <Button
                                variant="danger"
                                onClick={confirmationDialog.discard}
                            >
                                {t.DiscardChangesConfirmation}
                            </Button>
                            <AlertDialog.CancelButton>
                                {t.Cancel}
                            </AlertDialog.CancelButton>
                        </AlertDialog.Buttons>
                    </AlertDialog.Content>
                </AlertDialog>
            </div>
        </article>
    )
}

// {
//     "showing-placeholder": !showEditor,
// },

// <button
//     onClick={() => startTransition(() => setShowEditor(true))}
//     onFocus={() => startTransition(() => setShowEditor(true))}
//     type="button"
//     className="placeholder-btn"
// >
//     {props.placeholder}
// </button>

// useEffect(() => {
//     document.documentElement.style.setProperty(
//         "--vvp-h",
//         `${window.visualViewport?.height}px`,
//     )
//
//     let onresize = () => {
//         console.log(
//             "window.visualViewport.height",
//             window.visualViewport?.height,
//         )
//         console.log("window.innerHeight", window.innerHeight)
//         console.log(
//             "document.documentElement.clientHeight",
//             document.documentElement.clientHeight,
//         )
//         console.log(
//             "document.body.clientHeight",
//             document.body.clientHeight,
//         )
//         document.documentElement.style.setProperty(
//             "--vvp-h",
//             `${Math.ceil(window.visualViewport?.height ?? 0)}px`,
//         )
//     }
//
//     window.visualViewport?.addEventListener("resize", onresize)
//
//     return () =>
//         window.visualViewport?.removeEventListener("resize", onresize)
// })
