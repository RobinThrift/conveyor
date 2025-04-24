import React, {
    startTransition,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"

import type { Memo, MemoID } from "@/domain/Memo"
import { useOnVisible } from "@/ui/hooks/useOnVisible"

export function useMemoState(props: {
    memo: Memo
    collapsible?: boolean
    doubleClickToEdit?: boolean
    forceRender?: boolean
    actions?: {
        edit?: (
            memoID: MemoID,
            position?: { x: number; y: number; snippet?: string },
        ) => void
    }
}) {
    let ref = useRef<HTMLDivElement | null>(null)
    let isVisible = useOnVisible(ref, { ratio: 0.01 })
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
                let snippet = caret ? caret.text.slice(caret.offset) : undefined

                let rect = ref.current?.getBoundingClientRect()

                props.actions?.edit?.(props.memo.id, {
                    x: e.clientX - (rect?.x ?? 0),
                    y: e.clientY - (rect?.y ?? 0),
                    snippet: snippet?.split("\n")[0].trim(),
                })
            })
        }
    }, [props.memo.id, props.doubleClickToEdit, props.actions?.edit])

    let shouldRender =
        isVisible ||
        props.forceRender ||
        (ref.current?.getBoundingClientRect().top ?? 0) <
            (window.visualViewport?.pageTop ?? 0)

    return {
        ref,
        shouldRender,
        title,
        body,
        isExpanded,
        setIsExpanded,
        needsCollapsing,
        isCollapsed,
        onDoubleClick,
    }
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
