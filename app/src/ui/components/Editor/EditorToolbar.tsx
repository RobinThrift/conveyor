/** biome-ignore-all lint/a11y/useSemanticElements: follows best practices */
import React, { useCallback, useEffect, useId, useRef, useState } from "react"

import { decodeText } from "@/lib/textencoding"
import { DropdownMenu } from "@/ui/components/DropdownMenu"
import {
    ClipboardIcon,
    CodeBlockIcon,
    CodeIcon,
    CopyIcon,
    LinkIcon,
    TextBolderIcon,
    TextItalicIcon,
} from "@/ui/components/Icons"
import {
    Toolbar,
    ToolbarButton,
    ToolbarButtonGroup,
    ToolbarSeparator,
} from "@/ui/components/Toolbar"
import { useT } from "@/ui/i18n"

import type { PasteItem } from "./commands"
import type { ToolbarCommands } from "./TextEditor"

export function EditorToolbar({
    toggleBold,
    toggleItalics,
    toggleMonospace,
    insertLink,
    insertCodeBlock,
    copyToClipboard: copy,
    pasteFromClipboard: paste,
}: ToolbarCommands) {
    let t = useT("components/Editor/Toolbar")
    let ref = useRef<HTMLDivElement | null>(null)
    useToolbarPosition(ref)

    return (
        <Toolbar className="editor-toolbar" label={t.Label} ref={ref}>
            <ToolbarButtonGroup label={t.GroupTextFormatting}>
                <ToolbarButton
                    label={t.TextFormattingBold}
                    action={toggleBold}
                    icon={<TextBolderIcon />}
                />

                <ToolbarButton
                    label={t.TextFormattingItalic}
                    action={toggleItalics}
                    icon={<TextItalicIcon />}
                />

                <ToolbarButton
                    label={t.TextFormattingMonospace}
                    action={toggleMonospace}
                    icon={<CodeIcon />}
                />

                <ToolbarButton
                    label={t.InsertCodeBlock}
                    action={insertCodeBlock}
                    icon={<CodeBlockIcon />}
                />

                <ToolbarButton label={t.InsertLink} action={insertLink} icon={<LinkIcon />} />
            </ToolbarButtonGroup>

            <ClipboardButtons copyToClipboard={copy} pasteFromClipboard={paste} />
        </Toolbar>
    )
}

function ClipboardButtons(props: Pick<ToolbarCommands, "copyToClipboard" | "pasteFromClipboard">) {
    if (typeof navigator.clipboard === "undefined") {
        return null
    }

    return (
        <>
            <ToolbarSeparator />
            <ToolbarButtonGroup label="Clipboard">
                <ToolbarButton label="copy" action={props.copyToClipboard} icon={<CopyIcon />} />
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
        <DropdownMenu preventFocusOnPress={true}>
            <DropdownMenu.Trigger
                iconLeft={<ClipboardIcon />}
                aria-label="Paste"
                className="toolbar-btn"
            />
            <DropdownMenu.Items isFixed>
                <DropdownMenu.Item id={`paste-plain-text-${useId()}`} action={pastePlain}>
                    <DropdownMenu.ItemLabel>Paste Plain Text</DropdownMenu.ItemLabel>
                </DropdownMenu.Item>
                <DropdownMenu.Item id={`paste-as-markdown-${useId()}`} action={pasteAsMarkdown}>
                    <DropdownMenu.ItemLabel>Paste as Markdown</DropdownMenu.ItemLabel>
                </DropdownMenu.Item>
            </DropdownMenu.Items>
        </DropdownMenu>
    )
}

function useToolbarPosition(ref: React.RefObject<HTMLDivElement | null>) {
    // biome-ignore lint/style/noNonNullAssertion: this must be set
    let [initViewportHeight] = useState(() => window.visualViewport!.height)

    useEffect(() => {
        let toolbarEl = ref.current
        if (!toolbarEl) {
            return
        }

        // biome-ignore lint/style/noNonNullAssertion: this must be set
        let viewport = window.visualViewport!

        let viewPortHeight = viewport.height

        let raf: ReturnType<typeof requestAnimationFrame> | undefined

        let scrollDir = 1
        let scrollDistance = 0
        let lastScrollPos = 0

        toolbarEl.style.removeProperty("--offset-top")
        let rect = toolbarEl.getBoundingClientRect()

        let update = () => {
            let pageTop = viewport.pageTop
            if (viewPortHeight >= initViewportHeight) {
                scrollDistance = 0
                lastScrollPos = 0
                toolbarEl.style.removeProperty("--offset-top")
                raf = requestAnimationFrame(update)
                return
            }

            let lastScrollDir = scrollDir
            if (pageTop !== lastScrollPos && (lastScrollPos < pageTop || pageTop <= 0)) {
                scrollDir = 1
            } else if (pageTop !== lastScrollPos && pageTop < lastScrollPos) {
                scrollDir = -1
            }

            if (lastScrollDir !== scrollDir) {
                scrollDistance = 0
            } else {
                scrollDistance += Math.abs(pageTop - lastScrollPos)
            }
            lastScrollPos = pageTop

            if (scrollDir === 1) {
                toolbarEl.style.setProperty(
                    "--offset-top",
                    `calc(${Math.min(viewPortHeight + pageTop, initViewportHeight)}px - env(safe-area-inset-bottom, 0px) - var(--correction-factor-scroll-down))`,
                )
                toolbarEl.style.translate = "unset"
            } else if (scrollDir === -1) {
                toolbarEl.style.setProperty(
                    "--offset-top",
                    `calc(${CSS.px(Math.round(viewPortHeight))} + max(0px, ${CSS.px(
                        Math.round(initViewportHeight - viewPortHeight - scrollDistance),
                    )}) - ${rect.height}px - env(safe-area-inset-bottom, 0px) + var(--correction-factor-scroll-up))`,
                )
            }

            raf = requestAnimationFrame(update)
        }

        let onResize = (e: Event) => {
            let { height, pageTop } = e.target as VisualViewport

            if (pageTop < 0) {
                return
            }

            if (Math.round(viewPortHeight) === Math.round(height)) {
                return
            }

            if (raf) {
                cancelAnimationFrame(raf)
            }

            viewPortHeight = height

            if (pageTop > height) {
                scrollDir = -1
                scrollDistance = 0
                lastScrollPos = pageTop
            }

            if (viewPortHeight < initViewportHeight) {
                raf = requestAnimationFrame(update)
            }
        }

        viewport.addEventListener("resize", onResize, { passive: true })

        return () => {
            raf && cancelAnimationFrame(raf)
            viewport.removeEventListener("resize", onResize)
        }
    }, [ref.current, initViewportHeight])
}
