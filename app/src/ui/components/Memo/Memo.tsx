import clsx from "clsx"
import React, { useMemo } from "react"

import type { Memo as MemoT } from "@/domain/Memo"
import { DateTime } from "@/ui/components/DateTime"
import { CaretDownIcon } from "@/ui/components/Icons"
import { Link } from "@/ui/components/Link"
import { Markdown } from "@/ui/components/Markdown"
import { useT } from "@/ui/i18n"

import type { MemoActions } from "./MemoActions"
import { MemoActionsDropdown } from "./MemoActionsDropdown"
import { MemoDate } from "./MemoDate"
import { useMemoState } from "./useMemoState"

interface MemoProps {
    className?: string

    memo: MemoT

    actions?: Partial<MemoActions>

    headerLink?: boolean
    doubleClickToEdit?: boolean
    collapsible?: boolean
    forceRender?: boolean

    beforeTitle?: React.ReactElement
}

export const Memo = React.memo(function Memo(props: MemoProps) {
    let { ref, shouldRender, title, body, isExpanded, setIsExpanded, onDoubleClick } =
        useMemoState(props)
    let t = useT("components/Memo")

    let rendered = useMemo(() => {
        if (shouldRender) {
            return (
                <Markdown id={props.memo.id} onDoubleClick={onDoubleClick} className="memo-content">
                    {body}
                </Markdown>
            )
        }

        return null
    }, [shouldRender, body, props.memo.id, onDoubleClick])

    let renderedTitle = title ? (
        title
    ) : (
        <DateTime date={props.memo.createdAt} opts={{ dateStyle: "medium", timeStyle: "short" }} />
    )

    return (
        <article
            ref={ref}
            id={`memo-${props.memo.id}`}
            className={clsx("memo", props.className, {
                collapsible: props.collapsible,
                "is-expanded": isExpanded,
            })}
        >
            <div className="memo-header">
                <div className="memo-header-actions">
                    <MemoActionsDropdown memo={props.memo} actions={props.actions} />
                    {props.beforeTitle}
                </div>
                <h1>
                    {props.headerLink ? (
                        <Link
                            href={`?memo=${props.memo.id}`}
                            screen="memo.view"
                            params={{ memoID: props.memo.id }}
                            addParams
                        >
                            {renderedTitle}
                        </Link>
                    ) : (
                        renderedTitle
                    )}
                </h1>
                {title && <MemoDate createdAt={props.memo.createdAt} />}
            </div>

            {rendered}

            {props.collapsible && !isExpanded && (
                <div className="show-more-btn-sizer">
                    <button
                        type="button"
                        aria-label={t.ShowMore}
                        className="show-more-btn"
                        onClick={() => setIsExpanded(true)}
                    >
                        <CaretDownIcon weight="bold" />
                    </button>
                </div>
            )}
        </article>
    )
})
