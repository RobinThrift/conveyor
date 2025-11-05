import clsx from "clsx"
import React, { startTransition, useMemo, useRef } from "react"
import type { Temporal } from "temporal-polyfill"

import type { MemoID, Memo as MemoT } from "@/domain/Memo"
import { DateTime } from "@/ui/components/DateTime"
import { ErrorBoundary } from "@/ui/components/ErrorBoundary"
import { Markdown } from "@/ui/components/Markdown"

export type MemoProps = {
    className?: string
    memo: MemoT
    doubleClickToEdit?: boolean
    children: (_: {
        id: MemoID
        createdAt: Temporal.ZonedDateTime
        title?: string
        body: string
        onDoubleClick?: (e: React.MouseEvent) => void
    }) => React.ReactElement | React.ReactElement[]
}

export const Memo = React.memo(function Memo(props: MemoProps) {
    let { ref, title, body, onDoubleClick } = useMemoState(props)

    return (
        <article
            ref={ref}
            id={`memo-${props.memo.id}`}
            className={clsx("memo", { "no-title": !title }, props.className)}
        >
            {props.children({
                id: props.memo.id,
                createdAt: props.memo.createdAt,
                title,
                body,
                onDoubleClick,
            })}
        </article>
    )
})

export const MemoHeader = React.memo(function MemoTitle({ children }: React.PropsWithChildren) {
    return <header className="memo-header">{children}</header>
})

export const MemoTitle = React.memo(function MemoTitle({ children }: React.PropsWithChildren) {
    return <h1 className="memo-title">{children}</h1>
})

export function MemoDate({
    createdAt,
    relative = false,
}: {
    createdAt: Temporal.ZonedDateTime
    relative?: boolean
}) {
    return (
        <div className="memo-date">
            <DateTime
                date={createdAt}
                relative={relative}
                opts={{ dateStyle: "medium", timeStyle: "short" }}
            />
        </div>
    )
}

export const MemoBody = React.memo(function MemBody({
    id,
    title,
    children,
    onDoubleClick,
}: {
    id: MemoID
    title?: string
    children: string
    onDoubleClick?: (e: React.MouseEvent) => void
}) {
    return (
        <div className="memo-content">
            {title && <h1>{title}</h1>}
            <ErrorBoundary resetOn={[id]}>
                <Markdown id={id} onDoubleClick={onDoubleClick}>
                    {children}
                </Markdown>
            </ErrorBoundary>
        </div>
    )
})

export function useMemoState(props: { memo: MemoT; doubleClickToEdit?: boolean }) {
    let { title, body } = splitContent(props.memo.content)
    let ref = useRef<HTMLElement | null>(null)

    let onDoubleClick = useMemo(() => {
        if (!props.doubleClickToEdit) {
            return
        }

        return (e: React.MouseEvent) => {
            startTransition(() => {
                let caret = caretPositionFromPoint(e.clientX, e.clientY)
                let snippet = caret ? caret.text.slice(caret.offset) : undefined

                let rect = ref.current?.getBoundingClientRect()

                console.log(props.memo.id, {
                    x: e.clientX - (rect?.x ?? 0),
                    y: e.clientY - (rect?.y ?? 0),
                    snippet: snippet?.split("\n")[0].trim(),
                })
            })
        }
    }, [props.memo.id, props.doubleClickToEdit])

    return {
        ref,
        title,
        body,
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
