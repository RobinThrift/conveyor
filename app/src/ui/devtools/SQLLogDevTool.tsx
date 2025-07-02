import React, { useCallback, useMemo, useState, useSyncExternalStore } from "react"

import { newID } from "@/domain/ID"
import { Code } from "@/ui/components/Markdown/Code"

let formatter = new Intl.DateTimeFormat("en-gb", {
    timeStyle: "medium",
})

export function SQLLogDevTool() {
    let events = useSyncExternalStore(_sqlllog_subscribe, _sqlllog_getSnapshot)

    let [selected, setSelected] = useState<SQLLogStatementEvent | undefined>(undefined)

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
                        onClick={(e) => setSelected(e)}
                    />,
                )
            }

            if (events[i].type === "transaction") {
                els.push(
                    <Transaction
                        {...(events[i] as SQLLogTransactionEvent)}
                        key={events[i].id}
                        onClick={(e) => setSelected(e)}
                    />,
                )
            }
        }

        return els
    }, [events])

    return (
        <div className="devtools-entry-list-detail-wrapper">
            <ul className="devtools-entry-list">
                <li className="devtools-entry-list-header">
                    <button type="button" className="text-sm cursor-pointer" onClick={onClickClear}>
                        [clear]
                    </button>
                </li>
                {items}
            </ul>

            <div className="devtools-entry-list-item-details">
                {selected && <SQLEventDetails {...selected} />}
            </div>
        </div>
    )
}

const Event = React.memo(function Event({
    onClick,
    ...event
}: SQLLogStatementEvent & { onClick?: (e: SQLLogStatementEvent) => void }) {
    return (
        <li className="devtools-entry-list-item">
            <div className="devtools-entry-list-item-timing">
                {event.measure && <span>{event.measure.duration.toFixed(2)}ms</span>}
                <time>
                    {formatter.format(event.timestamp)}.{event.timestamp.getMilliseconds()}
                </time>
            </div>

            {/* biome-ignore lint/a11y/useButtonType: devtools only */}
            <button className="devtools-entry-list-item-title" onClick={() => onClick?.(event)}>
                {event.name}
            </button>
        </li>
    )
})

function SQLEventDetails({ name, measure, timestamp, sql, args = [] }: SQLLogStatementEvent) {
    let [showResolved, setShowResolved] = useState(false)
    let resolved = useMemo(() => {
        let count = 0
        return sql?.replaceAll(/\?(\d+)?/g, (_, index) => {
            count++
            if (!index) {
                return JSON.stringify(args[count - 1])
            }
            return JSON.stringify(args[Number.parseInt(index, 10) - 1])
        })
    }, [sql, args])

    return (
        <>
            <div className="devtools-entry-list-item-timing">
                {measure && <span>{measure.duration.toFixed(2)}ms</span>}
                <time>
                    {formatter.format(timestamp)}.{timestamp.getMilliseconds()}
                </time>
            </div>

            <h3 className="devtools-entry-list-item-title">{name}</h3>

            {sql && showResolved && (
                <Code className="dark rosepine rounded p-2 my-2 text-wrap text-sm" lang="sql">
                    {resolved ?? sql}
                </Code>
            )}

            {sql && !showResolved && (
                <Code className="dark rosepine rounded p-2 my-2 text-wrap text-sm" lang="sql">
                    {sql}
                </Code>
            )}

            {args.length && !showResolved ? (
                <Code className="dark rosepine rounded p-2 my-2 text-wrap text-sm" lang="json">
                    {JSON.stringify(
                        args,
                        undefined,
                        args.length > 2 || typeof args[0] === "object" ? 4 : undefined,
                    )}
                </Code>
            ) : null}

            {args.length ? (
                <button
                    type="button"
                    className="font-mono text-xs cursor-pointer"
                    onClick={() => setShowResolved(!showResolved)}
                >
                    {showResolved ? "Show Original" : "Resolve"}
                </button>
            ) : null}
        </>
    )
}

const Transaction = React.memo(function Transaction({
    statements,
    timestamp,
    measure,
    onClick,
}: SQLLogTransactionEvent & { onClick: (e: SQLLogStatementEvent) => void }) {
    let items = statements.map((event) => (
        <Event {...(event as SQLLogStatementEvent)} key={event.id} onClick={onClick} />
    ))

    return (
        <li className="devtools-entry-list-item">
            <div className="devtools-entry-list-item-timing">
                {measure && <span>{measure.duration.toFixed(2)}ms</span>}
                <time>
                    {formatter.format(timestamp)}.{timestamp.getMilliseconds()}
                </time>
            </div>

            <details>
                <summary>
                    <span className="devtools-entry-list-item-title inline!">Transaction</span>
                </summary>
                <ul className="devtools-entry-list">{items}</ul>
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
        .filter((entry) => entry.name.startsWith("sql:")) as IteratorObject<PerformanceMark>

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

function _performanceMarksToEvents(list: Iterable<PerformanceMark>): SQLLogEvent[] {
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
    let detail = (start.detail ?? {}) as { sql?: string; args?: any[] }

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
