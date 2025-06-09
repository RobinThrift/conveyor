import { createDevTools } from "@redux-devtools/core"
import { InspectorMonitor, type Tab } from "@redux-devtools/inspector-monitor"
import { TraceTab } from "@redux-devtools/inspector-monitor-trace-tab"
import React from "react"
import type { Action } from "redux"

let tabs = (
    defaultTabs: Tab<unknown, Action<string>>[],
): Tab<unknown, Action<string>>[] => {
    return [
        ...defaultTabs,
        { name: "Trace", component: TraceTab } as unknown as Tab<
            unknown,
            Action<string>
        >,
    ]
}

const rosepineTheme = {
    scheme: "Rosé Pine",
    author: "Emilia Dunfelt <edun@dunfelt.se>",
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

export const ReduxDevTools = createDevTools(
    <InspectorMonitor tabs={tabs} invertTheme={true} theme={rosepineTheme} />,
)

export const instrument = ReduxDevTools.instrument({
    trace: (a: Action) => {
        if ("trace" in a && a.trace) {
            return a.trace as string
        }

        let trace: { stack: typeof Error.prototype.stack } = { stack: "" }
        Error.captureStackTrace(trace)

        return trace.stack
    },
})
