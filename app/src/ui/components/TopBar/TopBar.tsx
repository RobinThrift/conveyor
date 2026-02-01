import React from "react"
import { createPortal } from "react-dom"

import { useIsMobile } from "@/ui/hooks/useIsMobile"
import { useCurrentScreen } from "@/ui/navigation"

const _topbarElement = (() => {
    let existing = document.getElementById("__TOPBAR__")
    if (existing) {
        return existing
    }

    let el = document.createElement("div")
    el.classList.add("topbar", "memo-tab-back-progress-target")
    el.id = "__TOPBAR__"

    document.body.appendChild(el)

    return el
})()

export function TopBar(props: React.PropsWithChildren) {
    let currentScreen = useCurrentScreen()
    let isMobile = useIsMobile()

    if (isMobile) {
        _topbarElement.dataset.activeStack = currentScreen?.stack
        return createPortal(props.children, _topbarElement)
    }

    return <>{props.children}</>
}
