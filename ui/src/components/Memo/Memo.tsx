import { Button } from "@/components/Button"
import { DateTime } from "@/components/DateTime"
import { Dialog } from "@/components/Dialog"
import { DropdownMenu } from "@/components/DropdownMenu"
import { Editor } from "@/components/Editor"
import { Link, LinkButton } from "@/components/Link"
import { Markdown } from "@/components/Markdown"
import type { Memo as MemoT } from "@/domain/Memo"
import type { Tag } from "@/domain/Tag"
import { useIsMobile } from "@/hooks/useIsMobile"
import { useOnVisible } from "@/hooks/useLoadOnVisible"
import { useT } from "@/i18n"
import type { UpdateMemoRequest } from "@/state/memos"
import { useGoto } from "@/state/router"
import {
    Archive,
    ArrowSquareOut,
    CaretDown,
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
    firstHeadingIsLink?: boolean
    collapsible?: boolean
    memo: MemoT
    tags: Tag[]
    actions?: Partial<MemoActions>
    doubleClickToEdit: boolean
    updateMemo: (memo: PartialMemoUpdate) => void
    viewTransitionName?: string
}

export function Memo(props: MemoProps) {
    let t = useT("components/Memo")
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
        <MemoEditor
            tags={props.tags}
            memo={memo}
            updateMemo={updateMemoContent}
            onCancel={onCancelEditting}
            placeCursorAt={doubleClickPos}
        />
    ) : (
        <MemoContent
            memo={memo}
            firstHeadingIsLink={props.firstHeadingIsLink}
            actions={actions}
            activateEditingMode={activateEditingMode}
            onDoubleClick={onDoubleClick}
            updateMemo={updateMemo}
        />
    )

    let ref = useRef<HTMLDivElement | null>(null)
    let [isExpanded, setIsExpanded] = useState(!props.collapsible)
    let needsCollapsing = ref.current
        ? ref.current.clientHeight < ref.current.scrollHeight
        : props.collapsible
    let isCollapsed = props.collapsible && !isExpanded && needsCollapsing

    useEffect(() => {
        if (isEditing) {
            setIsExpanded(true)
        }
    }, [isEditing])

    return (
        <article
            ref={ref}
            className={clsx("@container memo", props.className, {
                "is-editing": isEditing,
                "is-collapsed": needsCollapsing && isCollapsed,
                expanded: (needsCollapsing && !isCollapsed) || isExpanded,
            })}
            style={{
                viewTransitionName: props.viewTransitionName,
            }}
        >
            {children}
            <button
                type="button"
                aria-label={t.ShowMore}
                className="show-more-btn"
                onClick={() => setIsExpanded(true)}
            >
                <CaretDown weight="bold" />
            </button>
        </article>
    )
}

const MemoContent = React.forwardRef<
    HTMLDivElement,
    {
        memo: MemoT
        firstHeadingIsLink?: boolean

        actions: MemoActions
        activateEditingMode: () => void
        updateMemo: (memo: PartialMemoUpdate) => void
        onDoubleClick?: (e: React.MouseEvent) => void
    }
>(function MemoContent(
    {
        memo,
        firstHeadingIsLink,
        actions,
        activateEditingMode,
        updateMemo,
        onDoubleClick,
    },
    forwardRef,
) {
    let ref = useRef(null)
    let isVisible = useOnVisible(ref, { ratio: 0 })
    let { title, body } = splitContent(memo.content)

    let rendered = useMemo(() => {
        if (isVisible) {
            return (
                <Markdown
                    id={memo.id}
                    onDoubleClick={onDoubleClick}
                    ref={forwardRef}
                >
                    {body}
                </Markdown>
            )
        }

        return body
    }, [isVisible, body, memo.id, onDoubleClick, forwardRef])

    return (
        <>
            <div className="memo-header content" ref={ref}>
                {title ? (
                    <h1>
                        <MemoActions
                            memo={memo}
                            actions={actions}
                            activateEditingMode={activateEditingMode}
                            updateMemo={updateMemo}
                        />

                        {firstHeadingIsLink ? (
                            <Link href={`/memos/${memo.id}`} viewTransition>
                                {title}
                            </Link>
                        ) : (
                            title
                        )}
                    </h1>
                ) : (
                    <MemoActions
                        memo={memo}
                        actions={actions}
                        activateEditingMode={activateEditingMode}
                        updateMemo={updateMemo}
                    />
                )}
                <MemoDate createdAt={memo.createdAt} />
            </div>
            {rendered}
        </>
    )
})

export function MemoDate({
    createdAt,
}: {
    createdAt: Date
}) {
    return (
        <>
            <DateTime
                date={createdAt}
                className="memo-date sm"
                relative
                opts={{ dateStyle: "short", timeStyle: "short" }}
            />
            <DateTime date={createdAt} className="memo-date md" relative />
        </>
    )
}

function MemoActions({
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
    let goto = useGoto()

    return (
        <div className="memo-actions not-prose">
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
                    className="hidden @xs:flex"
                />
            )}

            {(actions.delete || actions.archive) && (
                <DropdownMenu>
                    <DropdownMenu.Trigger
                        ariaLabel="More memo actions"
                        iconRight={<DotsThreeVertical weight="bold" />}
                        size="sm"
                        plain
                    />
                    <DropdownMenu.Items>
                        <DropdownMenu.Item
                            className="@xs:hidden"
                            action={() => goto(`/memos/${memo.id}`)}
                        >
                            <DropdownMenu.ItemLabel icon={<ArrowSquareOut />}>
                                {t.View}
                            </DropdownMenu.ItemLabel>
                        </DropdownMenu.Item>

                        <DropdownMenu.Item
                            action={() =>
                                updateMemo({
                                    id: memo.id,
                                    isArchived: !memo.isArchived,
                                })
                            }
                        >
                            <DropdownMenu.ItemLabel icon={<Archive />}>
                                {memo.isArchived ? t.Unarchive : t.Archive}
                            </DropdownMenu.ItemLabel>
                        </DropdownMenu.Item>

                        <DropdownMenu.Item
                            destructive
                            action={() =>
                                updateMemo({
                                    id: memo.id,
                                    isDeleted: !memo.isDeleted,
                                })
                            }
                        >
                            <DropdownMenu.ItemLabel icon={<TrashSimple />}>
                                {memo.isDeleted ? t.Restore : t.Delete}
                            </DropdownMenu.ItemLabel>
                        </DropdownMenu.Item>
                    </DropdownMenu.Items>
                </DropdownMenu>
            )}
        </div>
    )
}

function MemoEditor(props: {
    tags: Tag[]
    memo: MemoT
    updateMemo: (memo: MemoT) => void
    onCancel: () => void
    placeCursorAt?: { x: number; y: number; snippet?: string }
}) {
    let isMobile = useIsMobile()
    let [memoEditorDialogOpen, setMemoEditorDialogOpen] = useState(isMobile)
    let createMemo = useCallback(
        (memo: MemoT) => {
            props.updateMemo({
                ...memo,
                content: memo.content.trim(),
            })
        },
        [props.updateMemo],
    )

    let editor = (
        <Editor
            memo={props.memo}
            tags={props.tags}
            onSave={createMemo}
            onCancel={props.onCancel}
            autoFocus={true}
            placeholder=""
            placeCursorAt={props.placeCursorAt}
            className="min-h-[200px]"
        />
    )

    if (isMobile) {
        return (
            <Dialog
                dismissible={false}
                modal={true}
                open={memoEditorDialogOpen}
                onOpenChange={setMemoEditorDialogOpen}
            >
                <Dialog.Title className="sr-only">Edit Memo</Dialog.Title>
                <Dialog.Description className="sr-only">
                    Edit Memo Dialog
                </Dialog.Description>

                <Dialog.Content
                    className="memo-editor-dialog"
                    withCloseButton={false}
                >
                    {editor}
                </Dialog.Content>
            </Dialog>
        )
    }

    return editor
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

let titleRegexp = /^#\s+.*/
function splitContent(content: string): { title?: string; body: string } {
    let trimmed = content.trim()
    let match = titleRegexp.exec(trimmed)
    if (!match) {
        return { body: trimmed }
    }

    let title = match[0].substring(2)
    let body = trimmed.substring(match.index + 1 + match[0].length)

    return { title, body }
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
