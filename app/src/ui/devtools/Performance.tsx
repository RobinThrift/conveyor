import React, { useMemo, useSyncExternalStore } from "react"

import { Code } from "@/ui/components/Markdown/Code"

export function PerformanceDevTool() {
    let entries = useSyncExternalStore(
        _observer_subscribe,
        _observer_getSnapshot,
    )

    let items = useMemo(() => {
        let els: React.ReactNode[] = []

        for (let i = entries.length - 1; i >= 0; i--) {
            if (entries[i].entryType === "measure") {
                let entry = entries[i] as PerformanceMeasure
                els.push(
                    <Measurement
                        key={`${entry.name}-${entry.startTime}`}
                        name={entry.name}
                        detail={entry.detail}
                        duration={entry.duration}
                        startTime={entry.startTime}
                    />,
                )
                continue
            }

            if (entries[i].entryType === "resource") {
                let entry = entries[i] as PerformanceResourceTiming
                els.push(
                    <Resource
                        key={`${entry.name}-${entry.startTime}`}
                        name={entry.name}
                        duration={entry.duration}
                        startTime={entry.startTime}
                        initiatorType={entry.initiatorType}
                        renderBlockingStatus={
                            "renderBlockingStatus" in entry
                                ? (entry.renderBlockingStatus as string)
                                : "unknown"
                        }
                        decodedBodySize={entry.decodedBodySize}
                    />,
                )
                continue
            }

            if (entries[i].entryType === "event") {
                let entry = entries[i] as PerformanceEventTiming
                els.push(
                    <PerfEvent
                        key={`${entry.name}-${entry.startTime}`}
                        name={entry.name}
                        duration={entry.duration}
                        startTime={entry.startTime}
                        processingStart={entry.processingStart}
                        processingEnd={entry.processingEnd}
                        target={entry.target}
                    />,
                )
                continue
            }

            if (entries[i].entryType === "navigation") {
                let entry = entries[i] as PerformanceNavigationTiming
                els.push(
                    <Navigation
                        key={`${entry.name}-${entry.startTime}`}
                        name={entry.name}
                        duration={entry.duration}
                        startTime={entry.startTime}
                        decodedBodySize={entry.decodedBodySize}
                        domComplete={entry.domComplete}
                        domInteractive={entry.domInteractive}
                    />,
                )
            }
        }

        return els
    }, [entries])

    return (
        <div className="dark min-h-full w-full relative overscroll-contain">
            <header className="sticky top-0 left-0 right-0 p-2 text-xl font-mono text-text backdrop-blur-sm flex justify-between items-center rounded">
                Performance
            </header>
            <ul className="divide-y divide-subtle">{items}</ul>
        </div>
    )
}

let formatter = new Intl.DateTimeFormat("en-gb", {
    timeStyle: "medium",
})

const Measurement = React.memo(function Measurment({
    name,
    detail,
    duration,
    startTime,
}: { name: string; detail?: any; duration: number; startTime: number }) {
    return (
        <li className="p-4 hover:bg-surface-level-1">
            <div className="flex items-center justify-between w-full text-subtle-light font-mono text-sm">
                <span>
                    {name}: {duration.toFixed(2)}ms
                </span>

                <time>
                    [
                    {formatter.format(
                        performance.timeOrigin + startTime.valueOf(),
                    )}
                    ]
                </time>
            </div>
            {detail && (
                <Code
                    className="dark rosepine rounded p-2 my-2 text-wrap text-sm"
                    lang="json"
                >
                    {JSON.stringify(detail)}
                </Code>
            )}
        </li>
    )
})

const Resource = React.memo(function Resource({
    name,
    duration,
    startTime,
    initiatorType,
    renderBlockingStatus,
    decodedBodySize,
}: {
    name: string
    duration: number
    startTime: number
    initiatorType: string
    renderBlockingStatus: string
    decodedBodySize: number
}) {
    return (
        <li className="p-4 hover:bg-surface-level-1">
            <div className="flex items-center justify-between w-full text-subtle-light font-mono text-sm">
                <span>
                    {name.replace(window.location.href, "")}:{" "}
                    {duration.toFixed(2)}ms
                    {` - ${(decodedBodySize / 1000).toFixed(2)}kB`}
                </span>

                <time>
                    [
                    {formatter.format(
                        performance.timeOrigin + startTime.valueOf(),
                    )}
                    ]
                </time>
            </div>

            <div className="flex items-center justify-between w-full text-subtle-light font-mono text-sm">
                <span>Initiator: {initiatorType}</span>
                <span>[{renderBlockingStatus}]</span>
            </div>
        </li>
    )
})

const PerfEvent = React.memo(function PerfEvent({
    name,
    duration,
    startTime,
    processingStart,
    processingEnd,
    target,
}: {
    name: string
    duration: number
    startTime: number
    processingStart: DOMHighResTimeStamp
    processingEnd: DOMHighResTimeStamp
    target: any
}) {
    return (
        <li className="p-4 hover:bg-surface-level-1">
            <div className="flex items-center justify-between w-full text-subtle-light font-mono text-sm">
                <span>{`Event ${name}: ${duration.toFixed(2)}ms`}</span>

                <time>
                    [
                    {formatter.format(
                        performance.timeOrigin + startTime.valueOf(),
                    )}
                    ]
                </time>
            </div>

            <div className="flex items-center w-full text-subtle-light font-mono text-sm gap-1">
                <span>Delay: {(processingStart - startTime).toFixed(3)}ms</span>
                <span>-</span>
                <span>
                    Event handler duration:{" "}
                    {(processingEnd - processingStart).toFixed(3)}ms
                </span>
                <span>-</span>
                <button
                    type="button"
                    onClick={() => console.log(target)}
                    className="cursor-pointer"
                >
                    Log Target
                </button>
            </div>
        </li>
    )
})

const Navigation = React.memo(function Resource({
    name,
    duration,
    startTime,
    decodedBodySize,
    domComplete,
    domInteractive,
}: {
    name: string
    duration: number
    startTime: number
    decodedBodySize: number
    domComplete: DOMHighResTimeStamp
    domInteractive: DOMHighResTimeStamp
}) {
    return (
        <li className="p-4 hover:bg-surface-level-1">
            <div className="flex items-center justify-between w-full text-subtle-light font-mono text-sm">
                <span>
                    {`${name}: ${duration.toFixed(2)}ms - ${(decodedBodySize / 1000).toFixed(2)}kB`}
                </span>

                <time>
                    [
                    {formatter.format(
                        performance.timeOrigin + startTime.valueOf(),
                    )}
                    ]
                </time>
            </div>

            <div className="flex items-center w-full text-subtle-light font-mono text-sm gap-1">
                <span>{`DOM Complete: ${(domComplete.valueOf() - startTime).toFixed(2)}ms`}</span>
                <span>-</span>
                <span>{`DOM Interactive: ${(domInteractive.valueOf() - startTime).toFixed(2)}ms`}</span>
            </div>
        </li>
    )
})

let _notifyMeasures: (() => void) | undefined = undefined
let _startMarks = new Map<string, PerformanceMark>()
let _snapshot: PerformanceEntry[] | undefined = undefined

const observer = new PerformanceObserver((list) => {
    if (!_notifyMeasures) {
        return
    }

    let entries: PerformanceMeasure[] = []

    for (let entry of list.getEntries()) {
        if (entry.name.startsWith("sql:")) {
            continue
        }

        if (entry.name.endsWith(":start")) {
            _startMarks.set(entry.name, entry as PerformanceMark)
            continue
        }

        if (entry.name.endsWith(":end")) {
            let name = entry.name.replace(":end", "")
            let start = _startMarks.get(`${name}:start`)
            if (!start) {
                continue
            }
            _startMarks.delete(start.name)
            entries.push(
                performance.measure(name, {
                    start: start.startTime,
                    end: entry.startTime,
                    detail: start.detail ?? (entry as PerformanceMark).detail,
                }),
            )
        }
    }

    _snapshot = [...(_snapshot ?? []), ...entries]

    _notifyMeasures()
})

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        observer.disconnect()
    })
}

const _entryTypes = ["mark", "navigation", "event", "resource"]

observer.observe({
    type: "event",
    durationThreshold: 16,
} as PerformanceObserverInit)

observer.observe({
    type: "resource",
    buffered: true,
})

observer.observe({
    type: "navigation",
    buffered: true,
})

observer.observe({
    type: "mark",
})

function _observer_subscribe(callback: () => void) {
    _notifyMeasures = callback

    return () => {
        _notifyMeasures = undefined
    }
}

function _observer_getSnapshot() {
    if (_snapshot) {
        return _snapshot
    }

    let entries: PerformanceEntry[] = []

    let allEntries = [
        ...performance.getEntries().values(),
        ...observer.takeRecords().values(),
    ]

    for (let entry of allEntries) {
        if (entry.name.startsWith("sql:")) {
            continue
        }

        if (!_entryTypes.includes(entry.entryType)) {
            continue
        }

        if (entry.name.endsWith(":start")) {
            _startMarks.set(entry.name, entry as PerformanceMark)
            continue
        }

        if (entry.name.endsWith(":end")) {
            let name = entry.name.replace(":end", "")
            let start = _startMarks.get(`${name}:start`)
            if (!start) {
                continue
            }
            _startMarks.delete(start.name)
            entries.push(
                performance.measure(name, {
                    start: start.startTime,
                    end: entry.startTime,
                    detail: start.detail ?? (entry as PerformanceMark).detail,
                }),
            )
            continue
        }

        entries.push(entry)
    }

    _snapshot = entries

    return entries
}
