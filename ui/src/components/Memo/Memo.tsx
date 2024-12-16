import { Tooltip } from "@/components//Tooltip"
import { Button } from "@/components/Button"
import { DateTime } from "@/components/DateTime"
import { DropdownMenu } from "@/components/DropdownMenu"
import { Editor } from "@/components/Editor"
import { LinkButton } from "@/components/Link"
import { Markdown } from "@/components/Markdown"
import type { Memo as MemoT } from "@/domain/Memo"
import type { Tag } from "@/domain/Tag"
import { useOnVisible } from "@/hooks/useLoadOnVisible"
import { useT } from "@/i18n"
import type { UpdateMemoRequest } from "@/state/memos"
import {
    Archive,
    ArrowSquareOut,
    DotsThreeVertical,
    Pencil,
    TrashSimple,
} from "@phosphor-icons/react"
import clsx from "clsx"
import React, {
    startTransition,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"

export type PartialMemoUpdate = UpdateMemoRequest

export interface MemoActions {
    edit: boolean
    link: boolean
    archive: boolean
    delete: boolean
}

const defaultActions: MemoActions = {
    edit: true,
    link: true,
    archive: true,
    delete: true,
}

interface MemoProps {
    className?: string
    memo: MemoT
    tags: Tag[]
    actions?: Partial<MemoActions>
    doubleClickToEdit: boolean
    onClickTag: (tag: string) => void
    updateMemo: (memo: PartialMemoUpdate) => void
    viewTransitionName?: string
}

export function Memo(props: MemoProps) {
    let [memo, setMemo] = useState(props.memo)
    let [actions, setActions] = useState({
        ...defaultActions,
        ...(props.actions ?? {}),
    })

    useEffect(() => {
        setActions({
            ...defaultActions,
            ...(props.actions ?? {}),
        })
    }, [props.actions])

    let [isEditing, setIsEditing] = useState(false)
    let [doubleClickPos, setDoubleClickPos] = useState<
        { x: number; y: number; snippet?: string } | undefined
    >(undefined)
    let activateEditingMode = useCallback(
        () => startTransition(() => setIsEditing(true)),
        [],
    )

    let updateMemoContent = useCallback(
        (memo: MemoT) => {
            startTransition(() => {
                setDoubleClickPos(undefined)
                setIsEditing(false)
                setMemo(memo)
            })
            props.updateMemo({
                id: memo.id,
                content: memo.content,
            })
        },
        [props.updateMemo],
    )

    let updateMemo = useCallback(
        (memo: PartialMemoUpdate) => {
            props.updateMemo(memo)
        },
        [props.updateMemo],
    )

    let onCancelEditting = useCallback(() => {
        startTransition(() => {
            setDoubleClickPos(undefined)
            setIsEditing(false)
        })
    }, [])

    useEffect(() => {
        setMemo(props.memo)
    }, [props.memo])

    let onDoubleClick = useMemo(() => {
        if (!actions.edit) {
            return
        }

        if (props.doubleClickToEdit) {
            return (e: React.MouseEvent) => {
                startTransition(() => {
                    let caret = caretPositionFromPoint(e.clientX, e.clientY)
                    let snippet = caret
                        ? caret.text.slice(caret.offset)
                        : undefined
                    setDoubleClickPos({
                        x: e.clientX,
                        y: e.clientY,
                        snippet: snippet?.split("\n")[0].trim(),
                    })
                    setIsEditing(true)
                })
            }
        }
    }, [props.doubleClickToEdit, actions.edit])

    let children = isEditing ? (
        <ChangeMemoEditor
            tags={props.tags}
            memo={memo}
            updateMemo={updateMemoContent}
            onCancel={onCancelEditting}
            placeCursorAt={doubleClickPos}
        />
    ) : (
        <MemoContent
            memo={memo}
            actions={actions}
            onClickTag={props.onClickTag}
            activateEditingMode={activateEditingMode}
            onDoubleClick={onDoubleClick}
            updateMemo={updateMemo}
        />
    )

    return (
        <article
            className={clsx("memo", props.className)}
            style={{
                viewTransitionName: props.viewTransitionName,
            }}
        >
            {children}
        </article>
    )
}

function MemoContent({
    memo,
    actions,
    onClickTag,
    activateEditingMode,
    updateMemo,
    onDoubleClick,
}: {
    memo: MemoT
    actions: MemoActions
    onClickTag: (tag: string) => void
    activateEditingMode: () => void
    updateMemo: (memo: PartialMemoUpdate) => void
    onDoubleClick?: (e: React.MouseEvent) => void
}) {
    let ref = useRef(null)
    let isVisible = useOnVisible(ref, { ratio: 0 })

    let rendered = useMemo(() => {
        if (isVisible) {
            return (
                <Markdown id={memo.id} onClickTag={onClickTag}>
                    {memo.content}
                </Markdown>
            )
        }

        return memo.content
    }, [isVisible, memo.content, memo.id, onClickTag])

    return (
        <>
            <MemoHeader
                memo={memo}
                actions={actions}
                activateEditingMode={activateEditingMode}
                updateMemo={updateMemo}
                ref={ref}
            />

            <div onDoubleClick={onDoubleClick}>{rendered}</div>
        </>
    )
}

const MemoHeader = React.forwardRef(function MemoHeader(
    {
        memo,
        actions,
        activateEditingMode,
        updateMemo,
    }: {
        memo: MemoT
        actions: MemoActions
        activateEditingMode: () => void
        updateMemo: (memo: PartialMemoUpdate) => void
    },
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
    let t = useT("components/Memo/DateTime")

    return (
        <div className="flex" ref={forwardedRef}>
            <Tooltip
                className="grid grid-cols-3"
                content={[
                    <span
                        key="createdat"
                        className="text-left"
                    >{`${t.CreatedAt}:`}</span>,
                    <DateTime
                        key="createdatdateime"
                        className="col-span-2"
                        date={memo.createdAt}
                    />,
                    <span
                        key="updatedat"
                        className="text-left"
                    >{`${t.UpdatedAt}:`}</span>,
                    <DateTime
                        key="updatedatdateime"
                        className="col-span-2"
                        date={memo.updatedAt}
                    />,
                ]}
            >
                <DateTime
                    date={memo.createdAt}
                    className="text-subtle-dark text-sm"
                    relative
                />
            </Tooltip>

            <MemoActionBar
                memo={memo}
                actions={actions}
                activateEditingMode={activateEditingMode}
                updateMemo={updateMemo}
            />
        </div>
    )
})

function MemoActionBar({
    memo,
    actions,
    activateEditingMode,
    updateMemo,
}: {
    memo: MemoT
    actions: MemoActions
    activateEditingMode: () => void
    updateMemo: (memo: PartialMemoUpdate) => void
}) {
    let t = useT("components/Memo/Actions")

    return (
        <div className="flex justify-end flex-1">
            {actions.edit && (
                <Button
                    iconLeft={<Pencil />}
                    plain={true}
                    size="sm"
                    onClick={activateEditingMode}
                />
            )}

            {actions.link && (
                <LinkButton
                    href={`/memos/${memo.id}`}
                    iconLeft={<ArrowSquareOut />}
                    plain={true}
                    size="sm"
                    viewTransition
                />
            )}

            {(actions.delete || actions.archive) && (
                <DropdownMenu
                    ariaLabel="More memo actions"
                    iconRight={<DotsThreeVertical weight="bold" />}
                    size="sm"
                    plain={true}
                    items={[
                        {
                            label: memo.isArchived ? t.Unarchive : t.Archive,
                            icon: <Archive />,
                            action: () =>
                                updateMemo({
                                    id: memo.id,
                                    isArchived: !memo.isArchived,
                                }),
                        },
                        {
                            label: memo.isDeleted ? t.Restore : t.Delete,
                            icon: <TrashSimple />,
                            destructive: true,
                            action: () =>
                                updateMemo({
                                    id: memo.id,
                                    isDeleted: !memo.isDeleted,
                                }),
                        },
                    ]}
                />
            )}
        </div>
    )
}

function ChangeMemoEditor(props: {
    tags: Tag[]
    memo: MemoT
    updateMemo: (memo: MemoT) => void
    onCancel: () => void
    placeCursorAt?: { x: number; y: number; snippet?: string }
}) {
    let createMemo = useCallback(
        (memo: MemoT) => {
            props.updateMemo({
                ...memo,
                content: memo.content.trim(),
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
            placholder=""
            placeCursorAt={props.placeCursorAt}
        />
    )
}

function caretPositionFromPoint(
    x: number,
    y: number,
): { text: string; offset: number } | undefined {
    // standard
    if ("caretPositionFromPoint" in document) {
        let node = globalThis.document.caretPositionFromPoint(x, y)
        return node
            ? {
                  text: node.offsetNode.textContent || "",
                  offset: node.offset,
              }
            : undefined
    }

    // WebKit
    if ("caretRangeFromPoint" in document) {
        let range = globalThis.document.caretRangeFromPoint(x, y)
        return range
            ? {
                  text: range.startContainer.textContent || "",
                  offset: range.startOffset,
              }
            : undefined
    }
}

declare global {
    interface Document {
        caretRangeFromPoint(x: number, y: number): Range | null

        caretPositionFromPoint(x: number, y: number): CaretPosition | null
    }

    interface CaretPosition {
        readonly offsetNode: Node
        readonly offset: number
    }
}
