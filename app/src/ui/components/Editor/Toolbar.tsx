import React, { useCallback, useEffect, useRef } from "react"
import {
    Button as AriaButton,
    Group as AriaGroup,
    Separator as AriaSeparator,
    ToggleButton as AriaToggleButton,
    Toolbar as AriaToolbar,
} from "react-aria-components"

import { DropdownMenu } from "@/ui/components/DropdownMenu"
import {
    ClipboardIcon,
    CodeIcon,
    CopyIcon,
    LinkIcon,
    TextBolderIcon,
    TextItalicIcon,
} from "@/ui/components/Icons"
import { useT } from "@/ui/i18n"

import { decodeText } from "@/lib/textencoding"

import type { ToolbarCommands } from "./TextEditor"
import type { PasteItem } from "./commands"

// biome-ignore lint/style/noNonNullAssertion: this is given
let initViewport = window.visualViewport!

export function Toolbar({
    toggleBold,
    toggleItalics,
    toggleMonospace,
    insertLink,
    copyToClipboard: copy,
    pasteFromClipboard: paste,
}: ToolbarCommands) {
    let t = useT("components/Editor/Toolbar")
    let ref = useRef<HTMLDivElement | null>(null)

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

    return (
        <AriaToolbar className="editor-toolbar" aria-label={t.Label} ref={ref}>
            <ToolbarButtonGroup label={t.GroupTextFormatting}>
                <ToolbarToggleButton
                    label={t.TextFormattingBold}
                    action={toggleBold}
                >
                    <TextBolderIcon />
                </ToolbarToggleButton>

                <ToolbarToggleButton
                    label={t.TextFormattingItalic}
                    action={toggleItalics}
                >
                    <TextItalicIcon />
                </ToolbarToggleButton>

                <ToolbarToggleButton
                    label={t.TextFormattingMonospace}
                    action={toggleMonospace}
                >
                    <CodeIcon />
                </ToolbarToggleButton>

                <ToolbarToggleButton label={t.InsertLink} action={insertLink}>
                    <LinkIcon />
                </ToolbarToggleButton>
            </ToolbarButtonGroup>

            <ClipboardButtons
                copyToClipboard={copy}
                pasteFromClipboard={paste}
            />
        </AriaToolbar>
    )
}

function ToolbarButtonGroup({
    label,
    children,
}: {
    label: string
    children: React.ReactNode | React.ReactNode[]
}) {
    return (
        <AriaGroup aria-label={label} className="toolbar-btn-grp">
            {children}
        </AriaGroup>
    )
}

function ToolbarButton({
    label,
    action,
    children,
}: {
    label: string
    action: () => void
    children: React.ReactNode
}) {
    return (
        <AriaButton
            className="btn primary plain toolbar-btn"
            aria-label={label}
            onPress={action}
            preventFocusOnPress
        >
            {children}
        </AriaButton>
    )
}

function ToolbarToggleButton({
    label,
    action,
    children,
}: {
    label: string
    action: () => void
    children: React.ReactNode
}) {
    return (
        <AriaToggleButton
            className="btn primary plain toolbar-btn"
            aria-label={label}
            onPress={action}
            preventFocusOnPress
        >
            {children}
        </AriaToggleButton>
    )
}

function ToolbarSeparator() {
    return (
        <AriaSeparator className="toolbar-separator" orientation="vertical" />
    )
}

function ClipboardButtons(
    props: Pick<ToolbarCommands, "copyToClipboard" | "pasteFromClipboard">,
) {
    if (typeof navigator.clipboard === "undefined") {
        return null
    }

    return (
        <>
            <ToolbarSeparator />
            <ToolbarButtonGroup label="Clipboard">
                <ToolbarButton label="copy" action={props.copyToClipboard}>
                    <CopyIcon />
                </ToolbarButton>
                <PasteMenu {...props} />
            </ToolbarButtonGroup>
        </>
    )
}

function PasteMenu({
    pasteFromClipboard,
}: Pick<ToolbarCommands, "pasteFromClipboard">) {
    let pastePlain = useCallback(() => {
        navigator.clipboard
            .readText()
            .then((text) => {
                pasteFromClipboard([{ type: "text", data: text }])
            })
            .catch(console.error)
    }, [pasteFromClipboard])

    let pasteAsMarkdown = useCallback(() => {
        navigator.clipboard
            .read()
            .then(async (clipboard) => {
                let items = [] as PasteItem[]

                for (let item of clipboard) {
                    let imgMime = item.types.find((t) => t.startsWith("image/"))
                    if (imgMime) {
                        items.push({
                            type: "blob",
                            mime: imgMime,
                            data: () => item.getType(imgMime),
                        })
                        continue
                    }

                    if (item.types.includes("text/html")) {
                        items.push({
                            type: "blob",
                            mime: "text/html",
                            data: () => item.getType("text/html"),
                        })
                        continue
                    }

                    if (item.types.includes("text/uri-list")) {
                        items.push({
                            type: "uri",
                            data: decodeText(
                                await item
                                    .getType("text/uri-list")
                                    .then((b) => b.arrayBuffer()),
                            ),
                        })
                        continue
                    }

                    if (item.types.includes("text/plain")) {
                        items.push({
                            type: "text",
                            data: decodeText(
                                await item
                                    .getType("text/plain")
                                    .then((b) => b.arrayBuffer()),
                            ),
                        })
                        continue
                    }

                    items.push({
                        type: "blob",
                        mime: item.types[0],
                        data: () => item.getType(item.types[0]),
                    })
                }

                pasteFromClipboard(items)
            })
            .catch(console.error)
    }, [pasteFromClipboard])

    return (
        <DropdownMenu>
            <DropdownMenu.Trigger
                plain
                variant="primary"
                iconLeft={<ClipboardIcon />}
                aria-label="Paste"
                preventFocusOnPress
            />
            <DropdownMenu.Items>
                <DropdownMenu.Item action={pastePlain}>
                    <DropdownMenu.ItemLabel>
                        Paste Plain Text
                    </DropdownMenu.ItemLabel>
                </DropdownMenu.Item>
                <DropdownMenu.Item action={pasteAsMarkdown}>
                    <DropdownMenu.ItemLabel>
                        Paste as Markdown
                    </DropdownMenu.ItemLabel>
                </DropdownMenu.Item>
            </DropdownMenu.Items>
        </DropdownMenu>
    )
}
