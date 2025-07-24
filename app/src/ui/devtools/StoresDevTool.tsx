import { Store, useStore } from "@tanstack/react-store"
import { format as formatDiffAsHTML } from "jsondiffpatch/formatters/html"
import { create as createJSONDiffPatchInstance } from "jsondiffpatch/with-text-diffs"
import React, { useMemo, useState } from "react"
import { JSONTree } from "react-json-tree"

const jsondiffpatch = createJSONDiffPatchInstance({ arrays: { detectMove: false } })

import clsx from "clsx"
import { StackTrace } from "./StackTrace"

type StoreEvent =
    | {
          timestamp: DOMHighResTimeStamp
          type: "init"
          currValues: Record<string, any>
      }
    | {
          timestamp: DOMHighResTimeStamp
          type: "state"
          currValues: Record<string, any>
          prevValues: Record<string, any>
          trace?: string
      }
    | {
          timestamp: DOMHighResTimeStamp
          duration?: DOMHighResTimeStamp
          name: string
          type: "effect"
          deps: string[]
          currValues: Record<string, any>
          prevValues: Record<string, any>
          trace?: string
      }
    | {
          timestamp: DOMHighResTimeStamp
          duration?: DOMHighResTimeStamp
          name: string
          type: "action"
          args: any[]
          currValues: Record<string, any>
          prevValues: Record<string, any>
          trace?: string
      }

let eventStore = new Store<StoreEvent[]>([])

export function StoresDevTool() {
    let events = useStore(eventStore)
    let [selected, setSelected] = useState<DOMHighResTimeStamp | undefined>(undefined)

    return (
        <div className="devtools-entry-list-detail-wrapper">
            <ul className="devtools-entry-list">
                {events.map((event) => {
                    let name =
                        event.type === "effect" || event.type === "action" ? event.name : undefined

                    let duration =
                        event.type === "effect" || event.type === "action"
                            ? event.duration
                            : undefined

                    let deps = event.type === "effect" ? event.deps : undefined

                    return (
                        <li
                            className={clsx("devtools-entry-list-item", {
                                active: selected === event.timestamp,
                            })}
                            key={event.timestamp}
                        >
                            <span className="devtools-entry-list-item-timing">
                                <span>+{(event.timestamp / 1000).toFixed(4)}s</span>
                                {duration && duration > 0 ? (
                                    <span>{duration?.toFixed(2)}ms</span>
                                ) : null}
                            </span>
                            {/* biome-ignore lint/a11y/useButtonType: devtools only */}
                            <button
                                className="devtools-entry-list-item-title cursor-pointer hover:underline text-sm"
                                onClick={() => setSelected(event.timestamp)}
                            >
                                {name && <span>{name}</span>}
                                <span className="font-mono">[{event.type}]</span>
                            </button>
                            {deps && (
                                <span className="devtools-entry-list-item-additional-info">
                                    Dependencies: {deps.join(", ")}
                                </span>
                            )}
                        </li>
                    )
                })}
            </ul>

            <div className="devtools-entry-list-item-details">
                {selected && <StoresAtTime key={selected} atTimestamp={selected} />}
            </div>
        </div>
    )
}

function StoresAtTime({ atTimestamp }: { atTimestamp: DOMHighResTimeStamp }) {
    let event = useStore(eventStore, (events) => events.find((e) => e.timestamp === atTimestamp))

    let diff = useMemo(() => {
        if (!event || event.type === "init") {
            return
        }

        let prevValues = makeErrorValuesDiffable(event.prevValues)
        let delta = jsondiffpatch.diff(prevValues, makeErrorValuesDiffable(event.currValues))

        return formatDiffAsHTML(delta, prevValues)
    }, [event])

    if (!event) {
        return null
    }

    let stack = event.type !== "init" ? event.trace : undefined

    let args = event.type === "action" ? event.args : undefined

    return (
        <div className="devtools-store-stores-at-time">
            <div className="devtools-store-value">
                {args && (
                    <JSONTree
                        data={args}
                        theme={jsonTreeTheme}
                        keyPath={["args"]}
                        shouldExpandNodeInitially={(_1, _2, level) => level < 5}
                    />
                )}

                {diff && (
                    <div
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: this is trusted input
                        dangerouslySetInnerHTML={{ __html: diff }}
                        className="dark rounded-lg my-2 bg-body text-text py-2"
                    />
                )}

                <JSONTree
                    data={event.currValues}
                    theme={jsonTreeTheme}
                    postprocessValue={(value) => {
                        if (value instanceof Error) {
                            return `Error: ${value.name}: ${value.message}${value.stack ? `\n${value.stack}` : ""}`
                        }
                        return value
                    }}
                    valueRenderer={(valStr, val, keyPath) => {
                        if (keyPath.toString().endsWith("error") && val) {
                            return <pre className="overflow-auto">{val as string}</pre>
                        }
                        return <span>{valStr as string}</span>
                    }}
                />
            </div>

            {stack && (
                <details>
                    <summary className="cursor-pointer">
                        <h4 className="inline">Trace</h4>
                    </summary>
                    <StackTrace
                        stack={stack}
                        filterFrames={(frame) =>
                            !frame.fileName.endsWith("tracing.ts") &&
                            !frame.fileName.endsWith("src/lib/store.ts") &&
                            !frame.fileName.includes("@tanstack/store") &&
                            !(
                                frame.fileName.includes("react-dom-client.development.js") &&
                                !frame.functionName?.includes("react-stack-bottom-frame")
                            )
                        }
                    />
                </details>
            )}
        </div>
    )
}

const observer = new PerformanceObserver((list) => {
    let newEvents = processEntries(list.getEntries())
    eventStore.setState((events) => [...events, ...newEvents])
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

let startTimes: Record<string, DOMHighResTimeStamp> = {}

function processEntries(entries: Iterable<PerformanceEntry>) {
    let initEvent: StoreEvent = {
        timestamp: 0,
        type: "init",
        currValues: {},
    }
    let newEvents: StoreEvent[] = []

    for (let entry of entries) {
        if (entry.entryType !== "mark") {
            continue
        }

        let mark = entry as PerformanceMark

        if (mark.name === "stores:init") {
            initEvent.timestamp = mark.startTime
            initEvent.currValues[mark.detail.name] = mark.detail.currValue
            continue
        }

        if (mark.name === "stores:update") {
            newEvents.push({
                timestamp: mark.startTime,
                type: "state",
                currValues: mark.detail.currValues,
                prevValues: mark.detail.prevValues,
                trace: mark.detail.trace,
            })
            continue
        }

        let parsed = parseMarkName(mark.name)
        if (!parsed) {
            continue
        }
        let { name, phase, type } = parsed

        if (type === "effects" && phase === "start") {
            startTimes[name] = mark.startTime
            continue
        }

        if (type === "effects" && phase === "end") {
            let { [name]: startTime, ...restStartTime } = startTimes
            newEvents.push({
                timestamp: mark.startTime,
                duration: startTime ? mark.startTime - startTime : undefined,
                name,
                deps: mark.detail.attrs.deps,
                type: "effect",
                currValues: mark.detail.attrs.finalState,
                prevValues: mark.detail.attrs.originalState,
                trace: mark.detail.attrs.trace,
            })
            startTimes = restStartTime
            continue
        }

        if (type === "actions" && phase === "start") {
            startTimes[name] = mark.startTime
            continue
        }

        if (type === "actions" && phase === "end") {
            let { [name]: startTime, ...restStartTime } = startTimes
            newEvents.push({
                timestamp: mark.startTime,
                duration: startTime ? mark.startTime - startTime : undefined,
                name,
                type: "action",
                args: mark.detail.attrs.args,
                currValues: mark.detail.attrs.finalState,
                prevValues: mark.detail.attrs.originalState,
                trace: mark.detail.attrs.trace,
            })
            startTimes = restStartTime
        }
    }

    if (eventStore.state.length === 0) {
        newEvents = [initEvent, ...newEvents]
    }

    return newEvents
}

const markNamePattern = /trace:(?<type>[a-z]+):(?<name>.+):(?<phase>start|end)/
function parseMarkName(
    name: string,
): { type: "effects" | "actions"; name: string; phase: "start" | "end" } | undefined {
    let match = markNamePattern.exec(name)
    if (!match?.groups) {
        return undefined
    }

    return {
        // biome-ignore lint/style/noNonNullAssertion: must never be null
        type: match!.groups!.type as "effects" | "actions",
        // biome-ignore lint/style/noNonNullAssertion: must never be null
        name: match!.groups!.name,
        // biome-ignore lint/style/noNonNullAssertion: must never be null
        phase: match!.groups!.phase as "start" | "end",
    }
}

function _init() {
    let newEvents = processEntries(observer.takeRecords())
    eventStore.setState((events) => [...events, ...newEvents])
}

_init()

function makeErrorValuesDiffable(value: any): any {
    if (value instanceof Error) {
        return {
            name: value.name,
            message: value.message,
            stack: value.stack,
            cause: makeErrorValuesDiffable(value.cause),
        }
    }

    if (typeof value === "object") {
        let diffable: Record<string, unknown> = {}
        for (let prop in value) {
            diffable[prop] = makeErrorValuesDiffable(value[prop])
        }
        return diffable
    }
    return value
}

const jsonTreeTheme = {
    scheme: "",
    author: "",
    base00: "#191724",
    base01: "#1f1d2e",
    base02: "#26233a",
    base03: "#6e6a86",
    base04: "#908caa",
    base05: "#e0def4",
    base06: "#e0def4",
    base07: "#524f67",
    base08: "#eb6f92",
    base09: "#f6c177",
    base0A: "#ebbcba",
    base0B: "#31748f",
    base0C: "#9ccfd8",
    base0D: "#c4a7e7",
    base0E: "#f6c177",
    base0F: "#524f67",
}
