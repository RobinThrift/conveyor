import { useStore } from "@tanstack/react-store"
import React, { startTransition, useEffect, useRef, useState } from "react"

import { MemoList } from "@/ui/components/MemoList"
import { OverFlowMask } from "@/ui/components/OverflowMask"
import { stores } from "@/ui/stores"
import { Sidebar } from "./Sidebar"
import { TabBar } from "./TabBar"
import { memoListTabID } from "./TabList"

export function ListScreen() {
    let isActive = useStore(stores.ui.activeMemos, (m) => m.length === 0)
    let offsetScrollTop = useStore(
        stores.ui.memoTabScrollOffsets,
        (s) => s[memoListTabID]?.scrollOffsetTop ?? 0,
    )
    let [offsetTop, setOffsetTop] = useState(0)
    let ref = useRef<HTMLDivElement | null>(null)

    // biome-ignore lint/correctness/useExhaustiveDependencies: this is intentional to prevent rerenders
    useEffect(() => {
        if (isActive) {
            startTransition(() => {
                setOffsetTop(ref.current?.getBoundingClientRect().top ?? 0)
            })

            window.scrollTo({ top: offsetScrollTop, behavior: "instant" })
        }
    }, [isActive])

    return (
        <div
            className="screen list-screen"
            style={{ "--offset-top": `${-offsetScrollTop + offsetTop}px` } as React.CSSProperties}
            ref={ref}
        >
            <Sidebar />

            <div className="list-screen-content">
                <MemoListTabPanel isActive={isActive} />
            </div>

            <TabBar />

            <OverFlowMask className="list-screen-overflow-mask" dir="top" />
        </div>
    )
}

const MemoListTabPanel = React.memo(function MemoListTabPanel({ isActive }: { isActive: boolean }) {
    return (
        <div
            className="memo-list-tab-panel"
            tabIndex={isActive ? 0 : -1}
            role="tabpanel"
            id={`tab-panel-${memoListTabID}`}
            aria-labelledby={`tab-${memoListTabID}`}
            aria-hidden={isActive ? "false" : "true"}
            inert={!isActive}
        >
            <MemoListTabPanelContent />
        </div>
    )
})

const MemoListTabPanelContent = React.memo(function MemoListTabPanelContent() {
    return (
        <div className="memo-list-container">
            <MemoList />
        </div>
    )
})
