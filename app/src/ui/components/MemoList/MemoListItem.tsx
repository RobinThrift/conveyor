import { useStore } from "@tanstack/react-store"
import clsx from "clsx"
import React, { startTransition, useCallback, useMemo } from "react"
import type { Temporal } from "temporal-polyfill"

import type { MemoID } from "@/domain/Memo"
import { DateTime } from "@/ui/components/DateTime"
import { ErrorBoundary } from "@/ui/components/ErrorBoundary"
import { Markdown } from "@/ui/components/Markdown"
import { MemoActionsDropdown } from "@/ui/components/Memo/MemoActionsDropdown"
import { getScrollOffsetTop } from "@/ui/navigation"
import { actions, selectors, stores } from "@/ui/stores"

export type MemoListItemProps = {
    className?: string
    memoID: MemoID
}

export function MemoListItem(props: MemoListItemProps) {
    let memo = useStore(stores.memos.memos, selectors.memos.get(props.memoID))

    let { body, title, isBookmarkForm } = useMemo(
        () => summarise(memo.content.trim(), 20),
        [memo.content],
    )

    let openMemo = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault()
            ;(e.target as HTMLElement).blur()

            let scrollOffsetTop = getScrollOffsetTop()

            startTransition(() => {
                actions.ui.openMemo(memo.id, scrollOffsetTop)
            })
        },
        [memo.id],
    )

    return (
        <article
            id={`memo-${memo.id}`}
            className={clsx(
                "memo memo-list-item",
                { "is-bookmark-form": isBookmarkForm },
                props.className,
            )}
        >
            <div className="memo-header">
                {title ? (
                    <>
                        <MemoListItemDate createdAt={memo.createdAt} />
                        <h1>
                            <a href={`/memos?memo=${memo.id}`} onClick={openMemo}>
                                {title}
                            </a>
                        </h1>
                    </>
                ) : (
                    <a href={`/memos?memo=${memo.id}`} onClick={openMemo}>
                        <MemoListItemDate createdAt={memo.createdAt} />
                    </a>
                )}

                <MemoActionsDropdown memo={memo} />
            </div>

            <ErrorBoundary resetOn={[memo]}>
                <Markdown id={memo.id} className="memo-content">
                    {body}
                </Markdown>
            </ErrorBoundary>

            <div className="show-more-blur" />
        </article>
    )
}

const MemoListItemDate = React.memo(function MemoListItemDate({
    createdAt,
}: {
    createdAt: Temporal.ZonedDateTime
}) {
    return (
        <div className="memo-date">
            <DateTime
                date={createdAt}
                relative={true}
                opts={{ dateStyle: undefined, timeStyle: "short" }}
            />
        </div>
    )
})

let blockStartPattern = /^\/\/\/\s+([a-zA-Z0-9]+).*?\n$/
let blockEndPattern = /^\/\/\/\s*\n$/

let codeBlockStartPattern = /^```\s+([a-zA-Z0-9]+).*?\n$/
let codeBlockEndPattern = /^```\s*\n$/

let mdImgPattern = /!\[.*?\]\(.+\)/

function summarise(content: string, lines: number) {
    let newline = /\n/g
    let body = ""
    let title = ""
    let isBookmarkForm = false

    let match = newline.exec(content)
    let countedLines = 0
    let start = 0
    let end = match?.index ?? -1
    let isInBlock = false
    for (; ; end !== -1) {
        if (end === -1 || countedLines >= lines) {
            break
        }

        let line = content.substring(start, end + 1)

        if (start === 0 && !title && line.substring(0, 2) === "# ") {
            title = line.substring(2)
            start = end + 1
            match = newline.exec(content)
            end = match?.index ?? content.length
            continue
        }

        body += line

        if (start === 0 && line.substring(0, 16) === "/// link-preview") {
            isBookmarkForm = true
            isInBlock = true
        }

        if (!isInBlock && (blockStartPattern.test(line) || codeBlockStartPattern.test(line))) {
            isInBlock = true
        }

        if (isInBlock && (blockEndPattern.test(line) || codeBlockEndPattern.test(line))) {
            isInBlock = false
            countedLines += Math.ceil(lines / 2)
        }

        if (!isInBlock) {
            countedLines++
        }

        if (!isInBlock && mdImgPattern.test(line)) {
            countedLines += Math.ceil(lines / 2)
        }

        if (end === content.length) {
            break
        }

        start = end + 1
        match = newline.exec(content)
        end = match?.index ?? content.length
    }

    if (body.length === 0) {
        body = content
    }

    return { title, body, isBookmarkForm }
}
