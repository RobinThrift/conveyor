import { Store, useStore } from "@tanstack/react-store"
import React, { useCallback, useState, useMemo } from "react"

import type { Span } from "@/lib/tracing"
import { Code } from "@/ui/components/Markdown/Code"

let _childSpans = new Map<string, Span[]>()
const tracingStore = new Store<{
    spans: Span[]
}>({
    spans: [],
})

export function TracingDevTool() {
    let { spans } = useStore(tracingStore)

    let [selected, setSelected] = useState<Span | undefined>(undefined)
    let [filter, setFilter] = useState<string | undefined>(undefined)

    let onClickClear = useCallback(() => {
        tracingStore.setState({ spans: [] })
        _childSpans.clear()
    }, [])

    let onChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) {
            setFilter(e.target.value)
        } else {
            setFilter(undefined)
        }
    }

    let items = useMemo(() => {
        let els: React.ReactNode[] = []

        for (let i = spans.length - 1; i >= 0; i--) {
            if (filter) {
                if (spans[i].name.toLowerCase().includes(filter.toLowerCase())) {
                    els.push(
                        <SpanListItem key={spans[i].id} span={spans[i]} onClick={setSelected} />,
                    )
                }
            } else {
                els.push(<SpanListItem key={spans[i].id} span={spans[i]} onClick={setSelected} />)
            }
        }

        return els
    }, [spans, filter])

    return (
        <div className="devtools-entry-list-detail-wrapper">
            <ul className="devtools-entry-list">
                <li className="devtools-entry-list-header">
                    <input type="search" name="devtools_tracing_search" onChange={onChangeSearch} />
                    <button type="button" className="text-sm cursor-pointer" onClick={onClickClear}>
                        [clear]
                    </button>
                </li>
                {items}
            </ul>

            <div className="devtools-entry-list-item-details">
                {selected && <SpanDetails span={selected} />}
            </div>
        </div>
    )
}

let formatter = new Intl.DateTimeFormat("en-gb", {
    timeStyle: "medium",
})

function SpanListItem({
    span,
    onClick,
}: {
    span: Span
    onClick?: (e: Span) => void
}) {
    return (
        <li className="devtools-entry-list-item">
            <div className="devtools-entry-list-item-timing">
                <span>
                    {(span.endTime && (span.endTime - span.startTime).toFixed(2)) ?? 0}
                    ms
                </span>

                <time>{formatter.format(performance.timeOrigin + span.startTime.valueOf())}</time>
            </div>

            {/* biome-ignore lint/a11y/useButtonType: devtools only */}
            <button
                className="devtools-entry-list-item-title cursor-pointer hover:underline text-sm"
                onClick={() => onClick?.(span)}
                title={span.name}
            >
                {span.name}
            </button>
        </li>
    )
}

const SpanDetails = React.memo(function SpanDetails({ span }: { span: Span }) {
    let duration = (span.endTime && span.endTime - span.startTime) ?? 0

    let hasChildren = useMemo(() => _childSpans.has(span.id), [span.id])

    return (
        <>
            <div className="devtools-entry-list-item-timing">
                <span>{duration.toFixed(2)}ms</span>

                <time>{formatter.format(performance.timeOrigin + span.startTime.valueOf())}</time>
            </div>

            <h3 className="devtools-entry-list-item-title">{span.name}</h3>

            {hasChildren && (
                <div className="devtools-span-gantt">
                    <SpanGantt span={span} />
                </div>
            )}

            {!hasChildren && Object.keys(span.attrs).length > 0 ? (
                <Code className="dark rosepine rounded p-2 my-2 text-wrap text-sm" lang="json">
                    {JSON.stringify(span.attrs, undefined, 2)}
                </Code>
            ) : null}
        </>
    )
})

const SpanGantt = React.memo(function SpanGantt({ span }: { span: Span }) {
    let startTime = span.startTime
    let endTime = span.endTime ?? performance.now()
    let totalDuration = endTime - startTime

    return (
        <div className="devtools-span-gantt-chart">
            <SpanGanttItem
                span={span}
                totalDuration={totalDuration}
                totalStartTime={span.startTime}
            />
        </div>
    )
})

const SpanGanttItem = React.memo(function SpanGanttItem({
    span,
    totalDuration,
    totalStartTime,
    level = 0,
}: {
    span: Span
    totalDuration: number
    totalStartTime: number
    level?: number
}) {
    let startTime = span.startTime
    let endTime = span.endTime ?? performance.now()
    let duration = endTime - startTime
    let width = (duration / totalDuration) * 100
    let offset = ((startTime - totalStartTime) / totalDuration) * 100

    let children = _childSpans.get(span.id) ?? []

    let [showDetails, setShowDetails] = useState(false)
    let hasDetails = Object.keys(span.attrs).length > 0

    return (
        <>
            <div className="devtools-span-gantt-item">
                <button
                    className="devtools-span-gantt-item-name"
                    type="button"
                    onClick={() => setShowDetails(!showDetails)}
                    disabled={!hasDetails}
                    style={{
                        paddingLeft: `calc(${level * 4} * var(--spacing))`,
                    }}
                    title={span.name}
                >
                    {span.name}
                </button>

                <div className="devtools-span-gantt-item-span">
                    <div
                        className="devtools-span-gantt-item-bar"
                        style={{
                            left: `${offset}%`,
                            width: `${width}%`,
                        }}
                    >
                        <span className="devtools-span-gantt-item-duration">
                            {duration.toFixed(2)}ms
                        </span>
                    </div>
                </div>
            </div>

            {showDetails && (
                <div className="devtools-span-gantt-item-details">
                    <Code className="dark rosepine rounded p-2 my-2 text-wrap text-sm" lang="json">
                        {JSON.stringify(span.attrs, undefined, 2)}
                    </Code>
                </div>
            )}

            {children.map((c) => (
                <SpanGanttItem
                    key={c.id}
                    span={c}
                    totalDuration={totalDuration}
                    totalStartTime={totalStartTime}
                    level={level + 1}
                />
            ))}
        </>
    )
})

const observer = new PerformanceObserver((list) => {
    let spans: Span[] = []

    for (let entry of list.getEntries()) {
        if (
            entry.entryType !== "mark" ||
            !entry.name.startsWith("trace:") ||
            !entry.name.endsWith(":end")
        ) {
            continue
        }

        spans.push((entry as PerformanceMark).detail)
    }

    if (spans.length) {
        tracingStore.setState((state) => ({
            spans: [...state.spans, ...spans],
        }))
    }
})

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        observer.disconnect()
    })
}

observer.observe({
    type: "mark",
    buffered: true,
})

function _init() {
    let rootSpans: Span[] = []

    let allEntries = [...observer.takeRecords().values()]

    for (let entry of allEntries) {
        if (
            entry.entryType !== "mark" ||
            !entry.name.startsWith("trace:") ||
            !entry.name.endsWith(":end")
        ) {
            continue
        }

        let perfEntry = entry as PerformanceMark

        let span: Span = {
            ...perfEntry.detail,
            endTime: perfEntry.detail.endTime ?? perfEntry.startTime,
        }
        if (span.parentSpan) {
            let childSpans = _childSpans.get(span.parentSpan) ?? []
            _childSpans.set(span.parentSpan, [...childSpans, span])
        } else {
            rootSpans.push(span)
        }
    }

    tracingStore.setState({ spans: rootSpans })
}

_init()
