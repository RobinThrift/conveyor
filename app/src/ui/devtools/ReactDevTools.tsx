import {
    type FiberRoot,
    getDisplayName,
    getFiberFromHostInstance,
    getLatestFiber,
    getNearestHostFiber,
    getTimings,
    isCompositeFiber,
    onCommitFiberRoot,
    traverseContexts,
    traverseProps,
    traverseRenderedFibers,
    traverseState,
} from "bippy"
import React, { useMemo, useState, useSyncExternalStore } from "react"
import { newID } from "@/domain/ID"

type ReactDevToolsEventDetails = {
    id: string
    props: {
        name: string
        prev: any
        next: any
    }[]
    state: {
        id: number
        prev: any
        next: any
    }[]
    context: {
        id: number
        prev: any
        next: any
    }[]
    dom?: HTMLElement
}

declare global {
    interface Window {
        __REACT_DEV_TOOLS_ENABLED__: boolean
        __REACT_DEV_TOOLS_SETUP__: boolean
        __REACT_DEV_TOOLS_DETAILS: WeakMap<PerformanceMeasure, ReactDevToolsEventDetails>
        __REACT_DEV_TOOLS_onCommitFiberRoot__: (fiber: FiberRoot) => void
    }
}

declare const __ENABLE_DEVTOOLS__: boolean

let formatter = new Intl.DateTimeFormat("en-gb", {
    timeStyle: "medium",
})

export function ReactDevTools() {
    let [isEnabled, setIsEnabled] = useState(window.__REACT_DEV_TOOLS_ENABLED__)
    let events = useSyncExternalStore(_reactLogs_subscribe, _reactLogs_getSnapshot)

    let items = useMemo(() => {
        let els: React.ReactNode[] = []

        for (let i = events.length - 1; i >= 0; i--) {
            let event = events[i] as PerformanceMeasure
            let detail = window.__REACT_DEV_TOOLS_DETAILS.get(event)
            let timestamp = performance.timeOrigin + event.startTime.valueOf()
            els.push(
                <li
                    key={`${event.name}-${timestamp}-${detail?.id}`}
                    className="p-4 hover:bg-surface-level-1"
                >
                    <div className="flex items-center justify-between w-full text-subtle-light font-mono text-sm">
                        <div className="flex items-center gap-1">
                            <span>
                                {`${event.name.replace("react:", "")} (${detail?.id}): ${event.duration.toFixed(2)}ms`}
                            </span>
                            <span>-</span>
                            <RenderHTMLElementReadable el={detail?.dom} />
                        </div>

                        <time>[{formatter.format(timestamp)}]</time>
                    </div>
                </li>,
            )
        }

        return els
    }, [events])

    return (
        <div className="dark h-full w-full overflow-auto relative overscroll-contain">
            <header className="sticky top-0 left-0 right-0 p-2 text-xl font-mono text-text backdrop-blur-sm flex justify-between items-center rounded">
                <button
                    type="button"
                    className="text-xs cursor-pointer"
                    onClick={() => {
                        setIsEnabled(!window.__REACT_DEV_TOOLS_ENABLED__)
                        window.__REACT_DEV_TOOLS_ENABLED__ = !window.__REACT_DEV_TOOLS_ENABLED__
                    }}
                >
                    {isEnabled ? "Disable" : "Enable"}
                </button>
            </header>
            <ul className="divide-y divide-subtle">{items}</ul>
        </div>
    )
}

const RenderHTMLElementReadable = React.memo(function RenderHTMLElementReadable({
    el,
}: {
    el: HTMLElement | undefined
}) {
    if (!el) {
        return
    }

    let tag = readableHTMLElement(el)

    return (
        <button
            type="button"
            className="cursor-pointer"
            onClick={() => {
                el.scrollIntoView()
                highlightElement(el, tag)
            }}
        >
            {tag}
        </button>
    )
})

function readableHTMLElement(el: HTMLElement) {
    let tag = el.tagName.toLowerCase()
    if (el.id) {
        tag = `${tag}#${el.id}`
    }
    if (el.classList.length) {
        tag = `${tag}.${el.classList.toString().replace(" ", ".")}`
    }

    return tag
}

let _notify: (() => void) | undefined
let _snapshot: PerformanceMeasure[] | undefined

const observer = new PerformanceObserver((list) => {
    if (!_notify) {
        return
    }

    let entries: PerformanceMeasure[] = []

    for (let entry of list.getEntries()) {
        if (!entry.name.startsWith("react:")) {
            continue
        }

        if (entry.entryType === "measure") {
            entries.push(entry as PerformanceMeasure)
        }
    }

    _snapshot = [...(_snapshot ?? []), ...entries]

    _notify()
})

function _reactLogs_subscribe(callback: () => void) {
    _notify = callback

    observer.observe({
        type: "measure",
        buffered: true,
    })

    return () => {
        _notify = undefined
        _snapshot = undefined
        observer.disconnect()
    }
}

function _reactLogs_getSnapshot() {
    if (_snapshot) {
        return _snapshot
    }

    _snapshot = []

    for (let entry of observer.takeRecords()) {
        if (!entry.name.startsWith("react:")) {
            continue
        }

        if (entry.entryType === "measure") {
            _snapshot.push(entry as PerformanceMeasure)
        }
    }

    return _snapshot
}

const highlightContainer = (() => {
    let existing = document.querySelector("#__react-devtools-highlight-container")
    if (existing) return existing

    let container = document.createElement("div")
    container.id = "__react-devtools-highlight-container"
    container.inert = true
    document.body.appendChild(container)
    return container
})()

function highlightElement(el: HTMLElement, name: string) {
    let rect = el.getBoundingClientRect()
    let highlight = document.createElement("div")
    highlight.classList.add("border", "border-danger", "rounded")
    highlight.style.position = "fixed"
    highlight.style.top = `${rect.top - 2}px`
    highlight.style.left = `${rect.left - 2}px`
    highlight.style.width = `${rect.width + 2}px`
    highlight.style.height = `${rect.height + 2}px`
    highlight.style.zIndex = "999999999"
    highlight.style.pointerEvents = "none"
    highlight.inert = true
    highlight.dataset.name = name

    let nameEl = document.createElement("span")
    nameEl.classList.add("font-mono", "text-xs")
    nameEl.textContent = name
    nameEl.style.position = "absolute"
    nameEl.style.bottom = "-1lh"
    nameEl.style.left = "0px"
    nameEl.style.backgroundColor = "red"
    nameEl.style.color = "white"
    nameEl.style.width = "fit-content"
    highlight.appendChild(nameEl)

    highlightContainer.appendChild(highlight)

    setTimeout(() => {
        highlightContainer.removeChild(highlight)
    }, 250)
}

if (__ENABLE_DEVTOOLS__) {
    // biome-ignore lint/style/noNonNullAssertion: if this is null all is lost anyway
    const rootElement = document.getElementById("__CONVEYOR_UI_ROOT__")!

    window.__REACT_DEV_TOOLS_ENABLED__ = false

    const limit = 20

    window.__REACT_DEV_TOOLS_onCommitFiberRoot__ = (root: FiberRoot) => {
        if (!window.__REACT_DEV_TOOLS_ENABLED__) {
            return
        }

        let c = 0

        let hostFiber = getFiberFromHostInstance(rootElement)
        let latestFiber = hostFiber ? getLatestFiber(hostFiber) : root.current

        traverseRenderedFibers(latestFiber, (fiber) => {
            c++
            if (c > limit) {
                return
            }

            let displayName = getDisplayName(fiber)
            let hostFiber = getNearestHostFiber(fiber)
            let isChildOfRoot = rootElement.contains(hostFiber?.stateNode)

            if (!isChildOfRoot) {
                return
            }

            requestAnimationFrame(() => {
                try {
                    if (stateNode instanceof HTMLElement) {
                        highlightElement(stateNode, displayName ?? fiber.key ?? "")
                    }
                } catch {
                    // ignore
                }
            })

            if (!displayName) {
                return
            }

            // A composite fiber represents a function or class component
            if (!isCompositeFiber(fiber)) {
                return
            }

            let stateNode = fiber.stateNode ?? hostFiber?.stateNode

            let detail: ReactDevToolsEventDetails = {
                id: newID(),
                props: [],
                state: [],
                context: [],
                dom: stateNode instanceof HTMLElement ? stateNode : undefined,
            }

            traverseProps(fiber, (propName, next, prev) => {
                if (next !== prev) {
                    detail.props.push({
                        name: propName,
                        prev,
                        next,
                    })
                }
            })

            traverseContexts(fiber, (next, prev) => {
                if (next !== prev) {
                    detail.context.push({
                        id: detail.context.length,
                        prev,
                        next,
                    })
                }
            })

            traverseState(fiber, (next, prev) => {
                if (next !== prev) {
                    detail.state.push({
                        id: detail.state.length,
                        prev: prev?.memoizedState,
                        next: next?.memoizedState,
                    })
                }
            })

            let timings = getTimings(fiber)
            let measue = performance.measure(`react:${displayName}`, {
                start: fiber.actualStartTime,
                end: (fiber.actualStartTime ?? 0) + timings.selfTime,
            })
            window.__REACT_DEV_TOOLS_DETAILS.set(measue, detail)
        })
    }

    if (!window.__REACT_DEV_TOOLS_SETUP__) {
        window.__REACT_DEV_TOOLS_SETUP__ = true
        window.__REACT_DEV_TOOLS_DETAILS = new WeakMap<
            PerformanceMeasure,
            ReactDevToolsEventDetails
        >()
        onCommitFiberRoot((root) => window.__REACT_DEV_TOOLS_onCommitFiberRoot__(root))
    }
}
