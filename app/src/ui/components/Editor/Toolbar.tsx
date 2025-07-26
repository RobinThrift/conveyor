import React, { useCallback, useEffect, useRef } from "react"
import {
    Button as AriaButton,
    Group as AriaGroup,
    Separator as AriaSeparator,
    ToggleButton as AriaToggleButton,
    Toolbar as AriaToolbar,
} from "react-aria-components"
import { decodeText } from "@/lib/textencoding"
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
import type { PasteItem } from "./commands"
import type { ToolbarCommands } from "./TextEditor"

let initViewport = getVisualViewport()

const resetPosition = "0px"

export function Toolbar({
    toggleBold,
    toggleItalics,
    toggleMonospace,
    insertLink,
    copyToClipboard: copy,
    pasteFromClipboard: paste,
}: ToolbarCommands) {
    let t = useT("components/Editor/Toolbar")
    let ref = useToolbarPosition()

    return (
        <AriaToolbar className="editor-toolbar" aria-label={t.Label} ref={ref}>
            <ToolbarButtonGroup label={t.GroupTextFormatting}>
                <ToolbarToggleButton label={t.TextFormattingBold} action={toggleBold}>
                    <TextBolderIcon />
                </ToolbarToggleButton>

                <ToolbarToggleButton label={t.TextFormattingItalic} action={toggleItalics}>
                    <TextItalicIcon />
                </ToolbarToggleButton>

                <ToolbarToggleButton label={t.TextFormattingMonospace} action={toggleMonospace}>
                    <CodeIcon />
                </ToolbarToggleButton>

                <ToolbarToggleButton label={t.InsertLink} action={insertLink}>
                    <LinkIcon />
                </ToolbarToggleButton>
            </ToolbarButtonGroup>

            <ClipboardButtons copyToClipboard={copy} pasteFromClipboard={paste} />
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
    return <AriaSeparator className="toolbar-separator" orientation="vertical" />
}

function ClipboardButtons(props: Pick<ToolbarCommands, "copyToClipboard" | "pasteFromClipboard">) {
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

function PasteMenu({ pasteFromClipboard }: Pick<ToolbarCommands, "pasteFromClipboard">) {
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
                                await item.getType("text/uri-list").then((b) => b.arrayBuffer()),
                            ),
                        })
                        continue
                    }

                    if (item.types.includes("text/plain")) {
                        items.push({
                            type: "text",
                            data: decodeText(
                                await item.getType("text/plain").then((b) => b.arrayBuffer()),
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
                    <DropdownMenu.ItemLabel>Paste Plain Text</DropdownMenu.ItemLabel>
                </DropdownMenu.Item>
                <DropdownMenu.Item action={pasteAsMarkdown}>
                    <DropdownMenu.ItemLabel>Paste as Markdown</DropdownMenu.ItemLabel>
                </DropdownMenu.Item>
            </DropdownMenu.Items>
        </DropdownMenu>
    )
}

function useToolbarPosition() {
    let ref = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!ref.current) {
            return
        }

        let reposition = () => {
            if (!ref.current) {
                return
            }

            let vp = getVisualViewport()
            let windowHeight = window.innerHeight

            if (vp.pageTop < 0) {
                animFrame = requestAnimationFrame(() => {
                    reposition()
                })
                return
            }

            if (document.activeElement === document.body || windowHeight <= vp.height) {
                setToolbarOffset(ref.current)
                return
            }

            let { bottom } = ref.current.getBoundingClientRect()
            let currOffset = getToolbarOffset(ref.current)
            let delta = Math.max(Math.floor(bottom - vp.height - currOffset), 0)
            if (-delta !== currOffset) {
                setToolbarOffset(ref.current, `${-delta}px`)
            }

            animFrame = requestAnimationFrame(() => {
                reposition()
            })
        }
        let animFrame: ReturnType<typeof requestAnimationFrame> | undefined

        let unsubResize = onResizeVisualViewport((resizedVp) => {
            if (animFrame) {
                cancelAnimationFrame(animFrame)
            }

            if (resizedVp.height < initViewport.height) {
                animFrame = requestAnimationFrame(() => {
                    reposition()
                })

                requestAnimationFrame(() => {
                    if (!ref.current) {
                        return
                    }

                    let selection = window.getSelection()
                    if (!selection || selection.type !== "Caret") {
                        return
                    }

                    let selectionRect = selection.getRangeAt(0).getBoundingClientRect()
                    if (selectionRect.height === 0) {
                        return
                    }

                    let rect = ref.current.getBoundingClientRect()
                    if (rect.height === 0) {
                        return
                    }

                    let diff = selectionRect.top - rect.top
                    if (selectionRect.top > rect.top) {
                        document.documentElement.scrollTo({
                            left: document.documentElement.scrollLeft,
                            top:
                                document.documentElement.scrollTop +
                                diff +
                                selectionRect.height * 2,
                            behavior: "smooth",
                        })
                    }
                })

                return
            }

            if (ref.current) {
                setToolbarOffset(ref.current)
            }
        })

        return () => {
            unsubResize()
        }
    })

    return ref
}

function setToolbarOffset(el: HTMLElement, offset: string = resetPosition) {
    el.style.setProperty("--toolbar-offset", offset)
}

function getToolbarOffset(el: HTMLElement) {
    return Number.parseInt(el.style.getPropertyValue("--toolbar-offset") ?? "0px", 10) || 0
}

function getVisualViewport() {
    // biome-ignore lint/style/noNonNullAssertion: this must be set
    let vp = window.visualViewport!
    return {
        height: vp.height,
        pageTop: vp.pageTop,
    }
}

function onResizeVisualViewport(cb: (vp: ReturnType<typeof getVisualViewport>) => void) {
    let onresize = () => {
        let updated = getVisualViewport()
        cb({ height: updated.height, pageTop: vp.pageTop })
    }

    // biome-ignore lint/style/noNonNullAssertion: this must be set
    let vp = window.visualViewport!
    vp.addEventListener("resize", onresize, { passive: true })

    return () => {
        vp.removeEventListener("resize", onresize)
    }
}
