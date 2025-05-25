import React, { useEffect, useRef } from "react"
import {
    Group as AriaGroup,
    ToggleButton as AriaToggleButton,
    Toolbar as AriaToolbar,
} from "react-aria-components"
import { createPortal } from "react-dom"

import {
    CodeIcon,
    LinkIcon,
    TextBolderIcon,
    TextItalicIcon,
} from "@/ui/components/Icons"
import { useT } from "@/ui/i18n"

import type { Commands } from "./Commands"

// biome-ignore lint/style/noNonNullAssertion: this is given
let initViewport = window.visualViewport!

export function Toolbar({
    toggleBold,
    toggleItalics,
    toggleMonospace,
    insertLink,
}: Commands) {
    let t = useT("components/Editor/Toolbar")
    let ref = useRef<HTMLDivElement | null>(null)

    let portalTarget = createPortalTarget()

    let lastScrollPos = useRef<number>(initViewport.pageTop)
    let dirChangeStart = useRef<number>(initViewport.pageTop)

    let animFrame = useRef<
        ReturnType<typeof requestAnimationFrame> | undefined
    >(undefined)

    useEffect(() => {
        let reposition = () => {
            if (!ref.current) {
                return
            }

            if (document.activeElement === document.body) {
                ref.current.style.setProperty("--toolbar-offset", "0px")
                return
            }

            // biome-ignore lint/style/noNonNullAssertion: this is given
            let vp = window.visualViewport!
            let pageTop = vp.pageTop

            let height = vp.height
            let windowHeight = window.innerHeight

            let lastPageTop = lastScrollPos.current
            lastScrollPos.current = pageTop

            if (windowHeight <= height) {
                ref.current.style.setProperty("--toolbar-offset", "0px")
                return
            }

            if (pageTop < windowHeight - height && lastPageTop !== pageTop) {
                let offset = -Math.floor(
                    windowHeight - height - Math.max(pageTop, 0),
                )
                ref.current.style.setProperty("--toolbar-offset", `${offset}px`)
                requestReposition()
                return
            }

            if (lastPageTop < pageTop) {
                dirChangeStart.current = pageTop
                ref.current.style.setProperty("--toolbar-offset", "0px")
                requestReposition()
                return
            }

            let rect = ref.current.getBoundingClientRect()
            let currOffset = Number.parseInt(
                ref.current.style.getPropertyValue("--toolbar-offset") ?? "",
                10,
            )
            let delta = Math.floor(rect.bottom - vp.height - currOffset)
            ref.current.style.setProperty("--toolbar-offset", `${-delta}px`)
        }

        let requestReposition = () => {
            if (animFrame.current) {
                cancelAnimationFrame(animFrame.current)
            }

            animFrame.current = requestAnimationFrame(() => {
                reposition()
            })
        }

        let onresize = () => {
            // biome-ignore lint/style/noNonNullAssertion: this is given
            let vp = window.visualViewport!
            let pageTop = vp.pageTop
            lastScrollPos.current = pageTop
            reposition()
        }

        let onscroll = () => {
            requestReposition()
        }

        let onblur = () => {
            if (ref.current) {
                ref.current.style.setProperty("--toolbar-offset", "0px")
            }
        }

        window.visualViewport?.addEventListener("resize", onresize, {
            passive: true,
        })

        window.visualViewport?.addEventListener("scroll", onscroll, {
            passive: true,
        })

        window.addEventListener("focusout", onblur, {
            passive: true,
        })

        return () => {
            window.visualViewport?.removeEventListener("resize", onresize)
            window.visualViewport?.removeEventListener("scroll", onscroll)
            window.removeEventListener("focusout", onblur)
        }
    }, [])

    return createPortal(
        <AriaToolbar className="editor-toolbar" aria-label={t.Label} ref={ref}>
            <AriaGroup
                aria-label={t.GroupTextFormatting}
                className="toolbar-btn-grp"
            >
                <AriaToggleButton
                    className="btn plain toolbar-btn"
                    aria-label={t.TextFormattingBold}
                    onPress={toggleBold}
                >
                    <TextBolderIcon />
                </AriaToggleButton>

                <AriaToggleButton
                    className="btn plain toolbar-btn"
                    aria-label={t.TextFormattingItalic}
                    onClick={toggleItalics}
                >
                    <TextItalicIcon />
                </AriaToggleButton>

                <AriaToggleButton
                    className="btn plain toolbar-btn"
                    aria-label={t.TextFormattingMonospace}
                    onClick={toggleMonospace}
                >
                    <CodeIcon />
                </AriaToggleButton>

                <AriaToggleButton
                    className="btn plain toolbar-btn"
                    aria-label={t.InsertLink}
                    onClick={insertLink}
                >
                    <LinkIcon />
                </AriaToggleButton>
            </AriaGroup>
        </AriaToolbar>,
        portalTarget,
    )
}

function createPortalTarget() {
    let target = document.getElementById("__CONVEYOR_TOOLBAR_PORTAL__")
    if (target) {
        return target
    }

    target = document.createElement("div")
    target.id = "__CONVEYOR_TOOLBAR_PORTAL__"
    document.body.appendChild(target)

    return target
}

createPortalTarget()
