import { useStore } from "@tanstack/react-store"
import React, { useEffect, useRef, useState } from "react"

import { MemoList } from "@/ui/components/MemoList"
import { stores } from "@/ui/stores"

export const allMemosTabID = "all-memos"

export const AllMemosTabPanel = React.memo(function AllMemosTabPanel({
    isActive,
}: {
    isActive: boolean
}) {
    let ref = useRef<HTMLDivElement | null>(null)
    let offsetScrollTop = useStore(
        stores.ui.memoTabScrollOffsets,
        (s) => s[allMemosTabID]?.scrollOffsetTop ?? 0,
    )

    let [offsetTop, setOffsetTop] = useState(0)

    // biome-ignore lint/correctness/useExhaustiveDependencies: this is intentional to prevent rerenders
    useEffect(() => {
        if (isActive) {
            setOffsetTop(ref.current?.getBoundingClientRect().top ?? 0)
            window.scrollTo({ top: offsetScrollTop, behavior: "instant" })
        }
    }, [isActive])

    return (
        <div
            className="all-memos-tab-panel"
            tabIndex={isActive ? 0 : -1}
            role="tabpanel"
            id={`tab-panel-${allMemosTabID}`}
            aria-labelledby={`tab-${allMemosTabID}`}
            aria-hidden={isActive ? "false" : "true"}
            inert={!isActive}
            style={{ "--offset-top": `${-offsetScrollTop + offsetTop}px` } as React.CSSProperties}
            ref={ref}
        >
            <AllMemosTabPanelList />
        </div>
    )
})

const AllMemosTabPanelList = React.memo(function AllMemosTabPanelList() {
    return (
        <div className="memo-list-container">
            <MemoList />
        </div>
    )
})
