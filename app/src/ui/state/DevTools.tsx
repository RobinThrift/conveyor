import { createDevTools } from "@redux-devtools/core"
import { DockMonitor } from "@redux-devtools/dock-monitor"
import { InspectorMonitor, type Tab } from "@redux-devtools/inspector-monitor"
import { TraceTab } from "@redux-devtools/inspector-monitor-trace-tab"
import React from "react"
import type { Action } from "redux"

import { SQLLogDevTool } from "@/lib/testhelper/SQLLogDevTool"

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

export const DevTools = createDevTools(
    <DockMonitor
        defaultIsVisible={false}
        defaultPosition="right"
        toggleVisibilityKey="ctrl-j"
        changeMonitorKey="ctrl-k"
        changePositionKey="ctrl-l"
    >
        <InspectorMonitor tabs={tabs} invertTheme={false} theme="ashes" />
        <SQLLogDevTool />
    </DockMonitor>,
)
