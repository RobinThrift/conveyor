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

interface MemoProps {
    className?: string
    memo: MemoT
    tags: Tag[]
    onClickTag: (tag: Tag) => void
    updateMemo: (memo: MemoT) => void
    doubleClickToEdit: boolean
}

export function Memo(props: MemoProps) {
    let [memo, setMemo] = useState(props.memo)

    let [isEditing, setIsEditing] = useState(false)
    let [doubleClickPos, setDoubleClickPos] = useState<
        { x: number; y: number; snippet?: string } | undefined
    >(undefined)
    let activateEditingMode = useCallback(
        () => startTransition(() => setIsEditing(true)),
        [],
    )

    let updateMemo = useCallback(
        (memo: MemoT) => {
            startTransition(() => {
                setDoubleClickPos(undefined)
                setIsEditing(false)
                setMemo(memo)
            })
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
    }, [props.doubleClickToEdit])

    let children = isEditing ? (
        <ChangeMemoEditor
            tags={props.tags}
            memo={memo}
            updateMemo={updateMemo}
            onCancel={onCancelEditting}
            placeCursorAt={doubleClickPos}
        />
    ) : (
        <MemoContent
            memo={memo}
            onClickTag={props.onClickTag}
            activateEditingMode={activateEditingMode}
            onDoubleClick={onDoubleClick}
        />
    )

    return (
        <article
            className={clsx(
                "rounded-lg border border-subtle bg-surface p-4 relative group",
                props.className,
            )}
        >
            {children}
        </article>
    )
}

function MemoContent({
    memo,
    onClickTag,
    activateEditingMode,
    onDoubleClick,
}: {
    memo: MemoT
    onClickTag: (tag: Tag) => void
    activateEditingMode: () => void
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
                activateEditingMode={activateEditingMode}
                ref={ref}
            />

            <div onDoubleClick={onDoubleClick}>{rendered}</div>
        </>
    )
}

const MemoHeader = React.forwardRef(function MemoHeader(
    {
        memo,
        activateEditingMode,
    }: { memo: MemoT; activateEditingMode: () => void },
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

            <MemoActions
                memo={memo}
                activateEditingMode={activateEditingMode}
            />
        </div>
    )
})

function MemoActions({
    memo,
    activateEditingMode,
}: { memo: MemoT; activateEditingMode: () => void }) {
    let t = useT("components/Memo/Actions")

    return (
        <div className="flex justify-end flex-1">
            <Button
                iconLeft={<Pencil />}
                plain={true}
                size="sm"
                onClick={activateEditingMode}
            />

            <LinkButton
                href={`/memos/${memo.id}`}
                iconLeft={<ArrowSquareOut />}
                plain={true}
                size="sm"
            />

            <DropdownMenu
                ariaLabel="More memo actions"
                iconRight={<DotsThreeVertical weight="bold" />}
                size="sm"
                plain={true}
                items={[
                    {
                        label: t.Archive,
                        icon: <Archive />,
                        action: () => console.log(t.Archive),
                    },
                    {
                        label: t.Delete,
                        icon: <TrashSimple />,
                        destructive: true,
                        action: () => console.log(t.Delete),
                    },
                ]}
            />
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
