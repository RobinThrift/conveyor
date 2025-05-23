import React, { useCallback, useSyncExternalStore } from "react"
import {
    ListBox as AriaListBox,
    ListBoxItem as AriaListBoxItem,
    ListLayout as AriaListLayout,
    Text as AriaText,
    Virtualizer as AriaVirtualizer,
} from "react-aria-components"

import { Code } from "@/ui/components/Markdown/Code"

export function PerformanceDevTool() {
    let entries = useSyncExternalStore(
        _observer_subscribe,
        _observer_getSnapshot,
    )

    let onClickClear = useCallback(() => {
        _snapshot = []
    }, [])

    return (
        <div className="dark min-h-full w-full relative overscroll-contain">
            <header className="sticky top-0 left-0 right-0 p-2 text-xl font-mono text-text backdrop-blur-sm flex justify-between items-center rounded z-[100]">
                Performance
                <button
                    type="button"
                    className="text-sm cursor-pointer"
                    onClick={onClickClear}
                >
                    [clear]
                </button>
            </header>
            <AriaVirtualizer
                layout={AriaListLayout}
                layoutOptions={{
                    estimatedRowHeight: 105,
                    gap: 0,
                    padding: 0,
                }}
            >
                <AriaListBox
                    aria-label="Performance items"
                    className="divide-y divide-subtle"
                    items={reverse(entries)}
                >
                    {(entry) => (
                        <Entry
                            id={`${entry.name}-${entry.startTime}`}
                            perfEntry={entry}
                        />
                    )}
                </AriaListBox>
            </AriaVirtualizer>
        </div>
    )
}

function* reverse<T>(a: Array<T>) {
    for (let i = a.length - 1; i >= 0; i--) {
        yield a[i]
    }
}

let formatter = new Intl.DateTimeFormat("en-gb", {
    timeStyle: "medium",
})

function Entry({ perfEntry }: { perfEntry: PerformanceEntry; id: string }) {
    if (perfEntry.entryType === "measure") {
        let entry = perfEntry as PerformanceMeasure
        return (
            <Measurement
                name={entry.name}
                detail={entry.detail}
                duration={entry.duration}
                startTime={entry.startTime}
            />
        )
    }

    if (perfEntry.entryType === "event") {
        let entry = perfEntry as PerformanceEventTiming
        return (
            <PerfEvent
                name={entry.name}
                duration={entry.duration}
                startTime={entry.startTime}
                processingStart={entry.processingStart}
                processingEnd={entry.processingEnd}
                target={entry.target}
            />
        )
    }

    if (perfEntry.entryType === "navigation") {
        let entry = perfEntry as PerformanceNavigationTiming
        return (
            <Navigation
                name={entry.name}
                duration={entry.duration}
                startTime={entry.startTime}
                decodedBodySize={entry.decodedBodySize}
                domComplete={entry.domComplete}
                domInteractive={entry.domInteractive}
            />
        )
    }
}

const Measurement = React.memo(function Measurment({
    name,
    detail,
    duration,
    startTime,
}: { name: string; detail?: any; duration: number; startTime: number }) {
    return (
        <AriaListBoxItem textValue={name} className="p-4">
            <div className="flex items-center justify-between w-full text-subtle-light font-mono text-sm">
                <span>
                    <AriaText slot="label">
                        {name}: {duration.toFixed(2)}ms
                    </AriaText>
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
        </AriaListBoxItem>
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
        <AriaListBoxItem textValue={name} className="p-4">
            <div className="flex items-center justify-between w-full text-subtle-light font-mono text-sm">
                <span>
                    <AriaText slot="label">
                        {`Event ${name}: ${duration.toFixed(2)}ms`}
                    </AriaText>
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
        </AriaListBoxItem>
    )
})

const Navigation = React.memo(function Navigation({
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
        <AriaListBoxItem textValue={name} className="p-4">
            <div className="flex items-center justify-between w-full text-subtle-light font-mono text-sm">
                <span>
                    <AriaText slot="label">
                        {`${name}: ${duration.toFixed(2)}ms - ${(decodedBodySize / 1000).toFixed(2)}kB`}
                    </AriaText>
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
        </AriaListBoxItem>
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

const _entryTypes = ["mark", "navigation", "event"]

observer.observe({
    type: "event",
    durationThreshold: 16,
} as PerformanceObserverInit)

observer.observe({
    type: "navigation",
    buffered: true,
})

observer.observe({
    type: "mark",
    buffered: true,
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
                    detail:
                        start.detail || (entry as PerformanceMark).detail
                            ? {
                                  ...(start.detail ?? {}),
                                  ...((entry as PerformanceMark).detail ?? {}),
                              }
                            : undefined,
                }),
            )
            continue
        }

        entries.push(entry)
    }

    _snapshot = entries

    return entries
}
