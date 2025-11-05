import { Store, useStore } from "@tanstack/react-store"
import React, { useCallback, useMemo, useState } from "react"

import { Code } from "@/ui/components/Markdown/Code"

import { StackTrace } from "./StackTrace"

type NavEntry = {
    timestamp: number
    method: string
    url: string
    screen: string
    stack: string
    params: any
    index: number
    trace: string
    _absoluteIndex: number
}

const navStore = new Store<{
    entries: NavEntry[]
}>({
    entries: [],
})

export function NavDevTool() {
    let { entries } = useStore(navStore)

    let [selected, setSelected] = useState<NavEntry | undefined>(undefined)
    let [filter, setFilter] = useState<string | undefined>(undefined)

    let onClickClear = useCallback(() => {
        navStore.setState({ entries: [] })
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

        for (let i = entries.length - 1; i >= 0; i--) {
            if (filter) {
                if (entries[i].url.toLowerCase().includes(filter.toLowerCase())) {
                    els.push(
                        <NavEntryItem
                            key={entries[i].timestamp}
                            entry={entries[i]}
                            onClick={setSelected}
                        />,
                    )
                }
            } else {
                els.push(
                    <NavEntryItem
                        key={entries[i].timestamp}
                        entry={entries[i]}
                        onClick={setSelected}
                    />,
                )
            }
        }

        return els
    }, [entries, filter])

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
                {selected && <NavEntryDetails entry={selected} />}
            </div>
        </div>
    )
}

let formatter = new Intl.DateTimeFormat("en-gb", {
    timeStyle: "medium",
})

function NavEntryItem({ entry, onClick }: { entry: NavEntry; onClick?: (e: NavEntry) => void }) {
    return (
        <li className="devtools-entry-list-item">
            <div className="devtools-entry-list-item-timing">
                <time>{formatter.format(entry.timestamp)}</time>
            </div>

            {/* biome-ignore lint/a11y/useButtonType: devtools only */}
            <button
                className="devtools-entry-list-item-title flex-col items-start! text-left cursor-pointer hover:underline text-sm"
                onClick={() => onClick?.(entry)}
                title={entry.url}
            >
                <code>
                    [{entry.method}] {entry.screen} ({entry.stack})
                </code>
                <code className="text-xs">{entry.url}</code>
                <code className="w-full text-xs">{entry._absoluteIndex}</code>
            </button>
        </li>
    )
}

const NavEntryDetails = React.memo(function NavEntryDetails({ entry }: { entry: NavEntry }) {
    return (
        <>
            <div className="devtools-entry-list-item-timing">
                <time>{formatter.format(entry.timestamp)}</time>
            </div>

            <h3 className="devtools-entry-list-item-title flex-wrap">
                <code className="w-full">
                    [{entry.method}] {entry.screen} ({entry.stack})
                </code>
                <code className="text-xs">{entry.url}</code>
                <code className="w-full text-xs">{entry._absoluteIndex}</code>
            </h3>

            <Code className="dark rosepine rounded p-2 my-2 text-wrap text-sm" lang="json">
                {JSON.stringify(entry.params, undefined, 2)}
            </Code>

            {entry.trace && (
                <StackTrace
                    stack={entry.trace}
                    filterFrames={(frame) =>
                        !frame.fileName.endsWith("src/lib/store.ts") &&
                        !frame.fileName.includes("@tanstack/store") &&
                        !(
                            frame.fileName.includes("react-dom-client.development.js") &&
                            !frame.functionName?.includes("react-stack-bottom-frame")
                        )
                    }
                />
            )}
        </>
    )
})

const observer = new PerformanceObserver((list) => {
    let { navEntries } = processEntries(list.getEntries())

    if (navEntries.length) {
        navStore.setState((state) => ({
            entries: [...state.entries, ...navEntries],
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
    let { navEntries } = processEntries(observer.takeRecords())
    navStore.setState({ entries: navEntries })
}

_init()

function processEntries(entries: Iterable<PerformanceEntry>) {
    let navEntries: NavEntry[] = []

    for (let entry of entries) {
        if (entry.entryType !== "mark" || !entry.name.startsWith("navigation:")) {
            continue
        }

        let method = entry.name.replace("navigation:", "")

        let perfEntry = entry as PerformanceMark

        navEntries.push({
            method,
            timestamp: entry.startTime,
            ...perfEntry.detail,
        })
    }

    return { navEntries }
}
