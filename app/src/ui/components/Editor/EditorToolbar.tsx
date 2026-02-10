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

const resetPosition = "0px"

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
            <DropdownMenu.Items>
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
        // biome-ignore lint/style/noNonNullAssertion: this must be set
        let evtTarget = window.visualViewport!
        let lastPageTop = evtTarget.pageTop
        let raf: ReturnType<typeof requestAnimationFrame> | undefined

        let onResize = (e: Event) => {
            if (!ref.current) {
                return
            }

            let { height, pageTop } = e.target as VisualViewport
            if (pageTop < 0) {
                return
            }

            if (raf) {
                cancelAnimationFrame(raf)
            }

            raf = requestAnimationFrame(() => {
                if (pageTop < initViewportHeight) {
                    setToolbarOffset(
                        ref.current,
                        `${Math.max(Math.floor(initViewportHeight - height), 0)}px`,
                    )
                }
            })
        }

        let onScroll = (e: Event) => {
            if (!ref.current) {
                return
            }

            let { pageTop } = e.target as VisualViewport
            let prevPageTop = lastPageTop
            lastPageTop = pageTop

            if (
                pageTop < 0 ||
                (typeof document.scrollingElement?.scrollHeight === "undefined"
                    ? true
                    : pageTop > document.scrollingElement.scrollHeight)
            ) {
                return
            }

            let dirIsUp = prevPageTop > pageTop

            if (prevPageTop === pageTop) {
                return
            }

            if (dirIsUp) {
                if (raf) {
                    cancelAnimationFrame(raf)
                }

                requestAnimationFrame(() => {
                    ref.current?.classList.add("is-scrolling-up")
                })
            } else {
                if (raf) {
                    cancelAnimationFrame(raf)
                }

                requestAnimationFrame(() => {
                    ref.current?.classList.remove("is-scrolling-up")
                })
            }
        }

        evtTarget.addEventListener("resize", onResize, { passive: true })
        evtTarget.addEventListener("scroll", onScroll, { passive: true })

        return () => {
            evtTarget.removeEventListener("resize", onResize)
            evtTarget.removeEventListener("scroll", onScroll)

            if (raf) {
                cancelAnimationFrame(raf)
            }
        }
    }, [ref.current, initViewportHeight])
}

function setToolbarOffset(el: HTMLElement | null, offset: string = resetPosition) {
    if (!el) {
        return
    }

    el.style.setProperty("--toolbar-offset", offset)
}
