import React, { useEffect } from "react"
import {
    Milkdown as InternalMilkdown,
    MilkdownProvider,
    useEditor,
} from "@milkdown/react"
import { commonmark } from "@milkdown/kit/preset/commonmark"
import { gfm } from "@milkdown/kit/preset/gfm"
import {
    Editor,
    rootCtx,
    defaultValueCtx,
    commandsCtx,
} from "@milkdown/kit/core"
import { type MilkdownPlugin, createSlice } from "@milkdown/kit/ctx"
import { $useKeymap } from "@milkdown/kit/utils"

import type { AttachmentID } from "@/domain/Attachment"
import type { Tag } from "@/domain/Tag"
import { EditorState } from "@milkdown/kit/prose/state"

export interface MilkdownProps {
    id: string
    className?: string

    value: string

    autoFocus?: boolean
    placeCursorAt?: { x: number; y: number; snippet?: string }

    placeholder?: string

    autocomplete?: {
        tags?: Tag[]
    }

    vimModeEnabled?: boolean

    // onCreateEditor?: (view: EditorView) => void
    onChange?: (text: string) => void

    transferAttachment(attachment: {
        id: AttachmentID
        filename: string
        content: ArrayBufferLike
    }): Promise<void>
}

export function Milkdown(props: MilkdownProps) {
    return (
        <div className={props.className}>
            <MilkdownProvider>
                <MilkdownEditor {...props} />
            </MilkdownProvider>
        </div>
    )
}

function MilkdownEditor(props: MilkdownProps) {
    let { get } = useEditor((root) =>
        Editor.make()
            .config((ctx) => {
                ctx.set(rootCtx, root)
                ctx.set(defaultValueCtx, props.value ?? "")
            })
            .use(vimPlugin)
            .use(vimKeyMap)
            .use(commonmark)
            .use(gfm),
    )

    useEffect(() => {
        get()?.ctx.set(defaultValueCtx, props.value)
    }, [get, props.value])

    // console.log("editor", get())

    return <InternalMilkdown />
}

const vimModeCtx = createSlice("normal", "vimModeCtx")

let vimPlugin: MilkdownPlugin = (ctx) => {
    ctx.inject(vimModeCtx)
    return () => {
        return () => {
            ctx.remove(vimModeCtx)
        }
    }
}

let vimKeyMap = $useKeymap("vim", {
    Test: {
        shortcuts: "i",
        command: (ctx) => {
            // (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView) => boolean
            return (state: EditorState) => {
                if (ctx.get(vimModeCtx) === "insert") {
                    return false
                }
                console.log("state", state)
                ctx.set(vimModeCtx, "insert")
                return true
            }
        },
    },

    Esc: {
        shortcuts: "Escape",
        command: (ctx) => {
            return () => {
                console.log("ESC")
                ctx.set(vimModeCtx, "normal")
                return true
            }
        },
    },
})
