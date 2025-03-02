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
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"

import type { MemoID, Memo as MemoT } from "@/domain/Memo"
import { Button } from "@/ui/components/Button"
import { DateTime } from "@/ui/components/DateTime"
import { DropdownMenu } from "@/ui/components/DropdownMenu"
import { Link, LinkButton } from "@/ui/components/Link"
import { Markdown } from "@/ui/components/Markdown"
import { useOnVisible } from "@/ui/hooks/useLoadOnVisible"
import { useT } from "@/ui/i18n"
import type { UpdateMemoRequest } from "@/ui/state/actions"
import { useGoto } from "@/ui/state/global/router"

export type PartialMemoUpdate = UpdateMemoRequest

export interface MemoActions {
    edit: (
        memoID: MemoID,
        position?: { x: number; y: number; snippet?: string },
    ) => void
    link: string
    archive: (memoID: MemoID, isArchived: boolean) => void
    delete: (memoID: MemoID, isDeleted: boolean) => void
}

interface MemoProps {
    className?: string
    memo: MemoT

    actions?: Partial<MemoActions>
    doubleClickToEdit?: boolean
    collapsible?: boolean
}

export const Memo = React.forwardRef<HTMLDivElement, MemoProps>(
    function Memo(props, forwardRef) {
        let t = useT("components/Memo")
        let ref = useRef<HTMLDivElement | null>(null)
        let isVisible = useOnVisible(ref, { ratio: 0 })
        let { title, body } = splitContent(props.memo.content)
        let [isExpanded, setIsExpanded] = useState(!props.collapsible)
        let [needsCollapsing, setNeedsCollapsing] = useState(
            props.collapsible ?? false,
        )
        let isCollapsed = props.collapsible && !isExpanded && needsCollapsing

        useEffect(() => {
            if (isExpanded) {
                return
            }

            let el = ref.current
            if (!el) {
                return
            }

            let observer = new ResizeObserver((entries) => {
                for (let entry of entries) {
                    setNeedsCollapsing(
                        entry.target.clientHeight < entry.target.scrollHeight,
                    )
                }
            })

            observer.observe(el)

            return () => {
                observer.disconnect()
            }
        }, [isExpanded])

        let onDoubleClick = useMemo(() => {
            if (!props.actions?.edit || !props.doubleClickToEdit) {
                return
            }

            return (e: React.MouseEvent) => {
                startTransition(() => {
                    let caret = caretPositionFromPoint(e.clientX, e.clientY)
                    let snippet = caret
                        ? caret.text.slice(caret.offset)
                        : undefined

                    let rect = ref.current?.getBoundingClientRect()

                    props.actions?.edit?.(props.memo.id, {
                        x: e.clientX - (rect?.x ?? 0),
                        y: e.clientY - (rect?.y ?? 0),
                        snippet: snippet?.split("\n")[0].trim(),
                    })
                })
            }
        }, [props.memo.id, props.doubleClickToEdit, props.actions?.edit])

        let rendered = useMemo(() => {
            if (isVisible) {
                return (
                    <Markdown
                        id={props.memo.id}
                        onDoubleClick={onDoubleClick}
                        ref={forwardRef}
                    >
                        {body}
                    </Markdown>
                )
            }

            return body
        }, [isVisible, body, props.memo.id, onDoubleClick, forwardRef])

        return (
            <article
                ref={ref}
                className={clsx("@container memo", props.className, {
                    "is-collapsed": needsCollapsing && isCollapsed,
                    expanded: (needsCollapsing && !isCollapsed) || isExpanded,
                })}
                style={{
                    viewTransitionName: `memo-${props.memo.id}`,
                }}
            >
                <div className="memo-header content">
                    {title ? (
                        <h1>
                            <MemoActions
                                memo={props.memo}
                                actions={props.actions}
                            />

                            {props.actions?.link ? (
                                <Link href={props.actions.link} viewTransition>
                                    {title}
                                </Link>
                            ) : (
                                title
                            )}
                        </h1>
                    ) : (
                        <MemoActions
                            memo={props.memo}
                            actions={props.actions}
                        />
                    )}
                    <MemoDate createdAt={props.memo.createdAt} />
                </div>
                {rendered}

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
    },
)

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
}: {
    memo: MemoT
    actions?: Partial<MemoActions>
}) {
    let t = useT("components/Memo/Actions")
    let goto = useGoto()

    return (
        <div className="memo-actions not-prose">
            {actions?.edit && (
                <Button
                    iconLeft={<Pencil />}
                    plain={true}
                    size="sm"
                    onClick={() => actions?.edit?.(memo.id)}
                />
            )}

            {actions?.link && (
                <LinkButton
                    href={actions.link}
                    iconLeft={<ArrowSquareOut />}
                    plain={true}
                    size="sm"
                    viewTransition
                    className="hidden @xs:flex"
                />
            )}

            {((actions?.delete ?? true) || (actions?.archive ?? true)) && (
                <DropdownMenu>
                    <DropdownMenu.Trigger
                        ariaLabel="More memo actions"
                        iconRight={<DotsThreeVertical weight="bold" />}
                        size="sm"
                        plain
                    />
                    <DropdownMenu.Items>
                        {actions?.link && (
                            <DropdownMenu.Item
                                className="@xs:hidden"
                                action={() =>
                                    actions?.link && goto(actions.link)
                                }
                            >
                                <DropdownMenu.ItemLabel
                                    icon={<ArrowSquareOut />}
                                >
                                    {t.View}
                                </DropdownMenu.ItemLabel>
                            </DropdownMenu.Item>
                        )}

                        {actions?.archive && (
                            <DropdownMenu.Item
                                action={() =>
                                    actions?.archive?.(
                                        memo.id,
                                        !memo.isArchived,
                                    )
                                }
                            >
                                <DropdownMenu.ItemLabel icon={<Archive />}>
                                    {memo.isArchived ? t.Unarchive : t.Archive}
                                </DropdownMenu.ItemLabel>
                            </DropdownMenu.Item>
                        )}

                        {actions?.delete && (
                            <DropdownMenu.Item
                                destructive
                                action={() =>
                                    actions?.delete?.(memo.id, !memo.isDeleted)
                                }
                            >
                                <DropdownMenu.ItemLabel icon={<TrashSimple />}>
                                    {memo.isDeleted ? t.Restore : t.Delete}
                                </DropdownMenu.ItemLabel>
                            </DropdownMenu.Item>
                        )}
                    </DropdownMenu.Items>
                </DropdownMenu>
            )}
        </div>
    )
}

// function MemoEditor(props: {
//     tags: Tag[]
//     memo: MemoT
//     updateMemo: (memo: MemoT) => void
//     onCancel: () => void
//     placeCursorAt?: { x: number; y: number; snippet?: string }
//     overrideKeybindings?: boolean
// }) {
//     let createMemo = useCallback(
//         (memo: MemoT) => {
//             props.updateMemo({
//                 ...memo,
//                 content: memo.content.trim(),
//             })
//         },
//         [props.updateMemo],
//     )
//
//     return (
//         <Editor
//             memo={props.memo}
//             tags={props.tags}
//             onSave={createMemo}
//             onCancel={props.onCancel}
//             autoFocus={true}
//             placeholder=""
//             placeCursorAt={props.placeCursorAt}
//             overrideKeybindings={props.overrideKeybindings}
//         />
//     )
// }

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
