import clsx from "clsx"
import React, { useMemo } from "react"

import type { Memo as MemoT } from "@/domain/Memo"
import { DateTime } from "@/ui/components/DateTime"
import { ListIcon, TableIcon } from "@/ui/components/Icons"
import { Memo, type MemoActions } from "@/ui/components/Memo"
import { Select } from "@/ui/components/Select"
import { useT } from "@/ui/i18n"
import { useSetting } from "@/ui/state/global/settings"
import {
    differenceInCalendarDays,
    format,
    roundToNearestMinutes,
} from "date-fns"

export type { MemoActions } from "@/ui/components/Memo"

export interface MemoListProps {
    className?: string
    memos: MemoT[]

    actions?: Partial<Omit<MemoActions, "link">>
    doubleClickToEdit?: boolean
}

export function MemoList(props: MemoListProps) {
    let [layout] = useSetting("theme.listLayout")

    let memos = useMemo(() => groupByDay(props.memos), [props.memos])

    let memoComponents = useMemo(
        () =>
            Object.entries(memos).map(([day, { memos, date, diffToToday }]) => (
                <div key={day} className="memo-list-day-group">
                    <DayHeader date={date} diffToToday={diffToToday} />
                    <hr className="memo-list-day-divider" />
                    <div className="memo-list-memos">
                        {memos.map((memo) => (
                            <Memo
                                key={memo.id}
                                memo={memo}
                                actions={{
                                    ...props.actions,
                                    link: `/memos/${memo.id}`,
                                }}
                                doubleClickToEdit={props.doubleClickToEdit}
                                collapsible={layout === "masonry"}
                            />
                        ))}
                    </div>
                </div>
            )),
        [memos, props.actions, layout, props.doubleClickToEdit],
    )

    return (
        <div
            className={clsx(
                "memo-list",
                `list-layout-${layout}`,
                props.className,
            )}
        >
            <LayoutSelect />
            {memoComponents}
        </div>
    )
}

function LayoutSelect() {
    let t = useT("components/MemoList/LayoutSelect")

    let [listLayout, setListLayout] = useSetting("theme.listLayout")

    return (
        <div className="memo-list-layout-select-positioner">
            <Select
                name="select-layout"
                ariaLabel={t.Label}
                value={listLayout}
                onChange={setListLayout}
                className="memo-list-layout-select"
            >
                <Select.Option value="masonry">
                    <div className="flex gap-1 items-center">
                        <ListIcon />
                        <span className="option-label">{t.LayoutMasonry}</span>
                    </div>
                </Select.Option>
                <Select.Option value="single">
                    <div className="flex gap-1 items-center">
                        <TableIcon />
                        <span className="option-label">{t.LayoutSingle}</span>
                    </div>
                </Select.Option>
                <Select.Option value="ultra-compact">
                    <div className="flex gap-1 items-center">
                        <TableIcon />
                        <span className="option-label">
                            {t.LayoutUltraCompact}
                        </span>
                    </div>
                </Select.Option>
            </Select>
        </div>
    )
}

function DayHeader({ date, diffToToday }: { date: Date; diffToToday: number }) {
    let t = useT("components/MemoList/DayHeader")
    let prefix = ""
    if (diffToToday < 1) {
        prefix = t.Today
    } else if (diffToToday === 1) {
        prefix = t.Yesterday
    }

    if (prefix) {
        return (
            <h2 className="memo-list-day">
                {prefix}
                <span className="named-day-date">
                    (
                    <DateTime date={date} opts={{ dateStyle: "medium" }} />)
                </span>
            </h2>
        )
    }

    return (
        <h2 className="memo-list-day">
            {prefix} <DateTime date={date} opts={{ dateStyle: "medium" }} />
        </h2>
    )
}

function groupByDay(
    memos: MemoT[],
): Record<string, { date: Date; memos: MemoT[]; diffToToday: number }> {
    let grouped: Record<
        string,
        { date: Date; memos: MemoT[]; diffToToday: number }
    > = {}
    let now = roundToNearestMinutes(new Date())

    memos.forEach((memo) => {
        let day = format(memo.createdAt, "yyyy-MM-dd")
        let diffToToday = differenceInCalendarDays(now, memo.createdAt)
        if (!grouped[day]) {
            grouped[day] = { date: memo.createdAt, memos: [], diffToToday }
        }
        grouped[day].memos.push(memo)
    })

    return grouped
}
