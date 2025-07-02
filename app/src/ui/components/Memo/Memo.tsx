import clsx from "clsx"
import React, { useMemo } from "react"

import type { Memo as MemoT } from "@/domain/Memo"
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
}

export function Memo(props: MemoProps) {
    let {
        ref,
        shouldRender,
        title,
        body,
        isExpanded,
        setIsExpanded,
        needsCollapsing,
        isCollapsed,
        onDoubleClick,
    } = useMemoState(props)
    let t = useT("components/Memo")

    let rendered = useMemo(() => {
        if (shouldRender) {
            return (
                <Markdown id={props.memo.id} onDoubleClick={onDoubleClick}>
                    {body}
                </Markdown>
            )
        }

        return null
    }, [shouldRender, body, props.memo.id, onDoubleClick])

    return (
        <article
            ref={ref}
            id={`memo-${props.memo.id}`}
            className={clsx("@container memo", props.className, {
                "is-collapsed": needsCollapsing && isCollapsed,
                expanded: (needsCollapsing && !isCollapsed) || isExpanded,
            })}
        >
            <div className="memo-header content">
                {title ? (
                    <h1>
                        <MemoActionsDropdown memo={props.memo} actions={props.actions} />

                        {props.headerLink ? (
                            <Link
                                href={`?memo=${props.memo.id}`}
                                screen="memo.view"
                                params={{ memoID: props.memo.id }}
                                stack="single-memo"
                            >
                                {title}
                            </Link>
                        ) : (
                            title
                        )}
                    </h1>
                ) : (
                    <MemoActionsDropdown memo={props.memo} actions={props.actions} />
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
                <CaretDownIcon weight="bold" />
            </button>
        </article>
    )
}
