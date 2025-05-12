import React, {
    useCallback,
    useMemo,
    useState,
    useSyncExternalStore,
} from "react"

import { newID } from "@/domain/ID"
import { Code } from "@/ui/components/Markdown/Code"

let formatter = new Intl.DateTimeFormat("en-gb", {
    timeStyle: "medium",
})

export function SQLLogDevTool() {
    let events = useSyncExternalStore(_sqlllog_subscribe, _sqlllog_getSnapshot)

    let onClickClear = useCallback(() => {
        _snapshot = []
    }, [])

    let items = useMemo(() => {
        let els: React.ReactNode[] = []

        for (let i = events.length - 1; i >= 0; i--) {
            if (events[i].type === "statement") {
                els.push(
                    <Event
                        {...(events[i] as SQLLogStatementEvent)}
                        key={events[i].id}
                    />,
                )
            }

            if (events[i].type === "transaction") {
                els.push(
                    <Transaction
                        {...(events[i] as SQLLogTransactionEvent)}
                        key={events[i].id}
                    />,
                )
            }
        }

        return els
    }, [events])

    return (
        <div className="min-h-full w-full relative overscroll-contain">
            <header className="sticky top-0 left-0 right-0 p-2 text-xl font-mono text-text backdrop-blur-sm flex justify-between items-center rounded">
                SQL Log
                <button
                    type="button"
                    className="text-sm cursor-pointer"
                    onClick={onClickClear}
                >
                    [clear]
                </button>
            </header>
            <ul className="divide-y divide-subtle">{items}</ul>
        </div>
    )
}

const Event = React.memo(function Event({
    name,
    sql,
    args = [],
    timestamp,
    measure,
}: SQLLogStatementEvent) {
    let [showResolved, setShowResolved] = useState(false)

    return (
        <li className="p-4 hover:bg-surface-level-1">
            <div className="flex items-center justify-between w-full text-subtle-light font-mono text-sm">
                <h3 className="capitalize">
                    {name}
                    {measure && (
                        <span>
                            {" - "}
                            {measure.duration.toFixed(2)}ms
                        </span>
                    )}
                </h3>

                <time className="text-sm">
                    [{formatter.format(timestamp)}.{timestamp.getMilliseconds()}
                    ]
                </time>
            </div>
            {sql && showResolved && (
                <Code
                    className="dark rosepine rounded p-2 my-2 text-wrap text-sm"
                    lang="sql"
                >
                    {sql.replaceAll(/\?(\d+)/g, (_, index) =>
                        JSON.stringify(args[Number.parseInt(index, 10) - 1]),
                    )}
                </Code>
            )}
            {sql && !showResolved && (
                <Code
                    className="dark rosepine rounded p-2 my-2 text-wrap text-sm"
                    lang="sql"
                >
                    {sql}
                </Code>
            )}
            {args.length && !showResolved ? (
                <Code
                    className="dark rosepine rounded p-2 my-2 text-wrap text-sm"
                    lang="json"
                >
                    {JSON.stringify(
                        args,
                        undefined,
                        args.length > 2 || typeof args[0] === "object"
                            ? 4
                            : undefined,
                    )}
                </Code>
            ) : null}
            {args.length ? (
                <button
                    type="button"
                    className="text-subtle-light font-mono text-xs cursor-pointer"
                    onClick={() => setShowResolved(!showResolved)}
                >
                    {showResolved ? "Show Original" : "Resolve"}
                </button>
            ) : null}
        </li>
    )
})

const Transaction = React.memo(function Transaction({
    statements,
    timestamp,
    measure,
}: SQLLogTransactionEvent) {
    let items = statements.map((event) => (
        <Event {...(event as SQLLogStatementEvent)} key={event.id} />
    ))

    return (
        <li className="p-4 hover:bg-surface-level-1">
            <details>
                <summary className="text-subtle-light font-mono cursor-pointer text-sm flex items-center justify-between">
                    <span>
                        Transaction
                        {measure && (
                            <span className="text-subtle-light font-mono">
                                {" - "}
                                {measure.duration.toFixed(2)}ms
                            </span>
                        )}
                    </span>

                    <time className="text-sm">
                        [{formatter.format(timestamp)}.
                        {timestamp.getMilliseconds()}]
                    </time>
                </summary>
                <ul className="divide-y divide-subtle ps-8">{items}</ul>
            </details>
        </li>
    )
})

type SQLLogStatementEvent = {
    id: string
    type: "statement"
    timestamp: Date
    name: string
    sql?: string
    args?: any[]

    measure?: PerformanceMeasure
}

type SQLLogTransactionEvent = {
    id: string
    type: "transaction"
    timestamp: Date
    statements: SQLLogStatementEvent[]

    measure?: PerformanceMeasure
}

type SQLLogEvent = SQLLogStatementEvent | SQLLogTransactionEvent

let _notifyMeasures: (() => void) | undefined = undefined
let _startMarks = new Map<string, PerformanceMark>()
let _currentTransaction: SQLLogTransactionEvent | undefined = undefined
let _currentTransactionStartTime: DOMHighResTimeStamp | undefined
let _snapshot: SQLLogEvent[] | undefined = undefined

const observer = new PerformanceObserver((list) => {
    if (!_notifyMeasures) {
        return
    }

    let entries = list
        .getEntriesByType("mark")
        .values()
        .filter((entry) =>
            entry.name.startsWith("sql:"),
        ) as IteratorObject<PerformanceMark>

    let sqlEvents = _performanceMarksToEvents(entries)
    _snapshot = [...(_snapshot ?? []), ...sqlEvents]

    _notifyMeasures()
})

function _sqlllog_subscribe(callback: () => void) {
    _notifyMeasures = callback

    observer.observe({
        type: "mark",
        buffered: true,
    })

    return () => {
        observer.disconnect()
        _snapshot = undefined
        _notifyMeasures = undefined
    }
}

function _sqlllog_getSnapshot() {
    if (_snapshot) {
        return _snapshot
    }

    let entries = [
        ...performance.getEntriesByType("mark").values(),
        ...observer.takeRecords().values(),
    ].filter((entry) => entry.name.startsWith("sql:")) as PerformanceMark[]

    _snapshot = _performanceMarksToEvents(entries)

    return _snapshot
}

let _namePattern = /sql:(.+):start/

function _performanceMarksToEvents(
    list: Iterable<PerformanceMark>,
): SQLLogEvent[] {
    let events: SQLLogEvent[] = []

    for (let entry of list) {
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
            let event = marksToEvent({ start, end: entry })
            if (event) {
                events.push(event)
            }
        }
    }

    return events
}

function marksToEvent({
    start,
    end,
}: { start: PerformanceMark; end: PerformanceMark }): SQLLogEvent | undefined {
    let detail = start.detail as { sql?: string; args?: any[] }

    if (detail.sql?.startsWith("BEGIN DEFERRED TRANSACTION")) {
        _currentTransaction = {
            id: newID(),
            type: "transaction",
            timestamp: new Date(),
            statements: [],
        }
        _currentTransactionStartTime = start.startTime
        return
    }

    if (detail.sql?.startsWith("COMMIT")) {
        if (_currentTransaction) {
            let event = _currentTransaction
            let start = _currentTransactionStartTime
            _currentTransaction = undefined
            _currentTransactionStartTime = undefined

            event.measure = performance.measure(event.type, {
                start,
                end: end.startTime,
            })

            return event
        }
        return
    }

    _namePattern.lastIndex = 0
    let name = _namePattern.exec(start.name)

    let statement: SQLLogStatementEvent = {
        id: newID(),
        type: "statement",
        timestamp: new Date(),
        ...detail,
        name: name ? name[1] : start.name,
    }

    statement.measure = performance.measure(statement.type, {
        start: start.startTime,
        end: end?.startTime,
    })

    if (statement.sql?.startsWith("-- name: ")) {
        let firstNewLine = statement.sql.indexOf("\n")
        let name = statement.sql.substring(9, firstNewLine)
        statement.sql = statement.sql.substring(firstNewLine).trim()
        statement.name = `${statement.name} [${name}]`
    }

    if (_currentTransaction) {
        _currentTransaction.statements.push(statement)
        return
    }

    return statement
}
