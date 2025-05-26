import {
    autocompletion,
    closeBrackets,
    closeBracketsKeymap,
} from "@codemirror/autocomplete"
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands"
import { markdown, markdownLanguage } from "@codemirror/lang-markdown"
import {
    bracketMatching,
    defaultHighlightStyle,
    indentOnInput,
    indentUnit,
    syntaxHighlighting,
} from "@codemirror/language"
import { languages } from "@codemirror/language-data"
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search"
import type { Extension } from "@codemirror/state"
import {
    EditorView,
    drawSelection,
    dropCursor,
    keymap,
    placeholder as placeholderExt,
} from "@codemirror/view"

import type { AttachmentID } from "@/domain/Attachment"
import type { Tag } from "@/domain/Tag"

import { attachments } from "./attachments"
import { fileDropHandler } from "./fileDropHandler"
import { tagAutoComplete } from "./tagAutoComplete"
import { theme } from "./theme"
import { toolbarPositionFix } from "./toolbarPositionFix"
import { vim } from "./vim"

export const extensions = ({
    placeholder,
    autocomplete,
    vimModeEnabled,
    transferAttachment,
}: {
    placeholder?: string
    autocomplete?: {
        tags?: Tag[]
    }
    vimModeEnabled?: boolean
    transferAttachment(attachment: {
        id: AttachmentID
        filename: string
        content: ArrayBufferLike
    }): Promise<void>
}) => {
    let exts: Extension[] = [
        keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            ...searchKeymap,
        ]),
        indentUnit.of(" ".repeat(4)),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        indentOnInput(),
        highlightSelectionMatches(),
        drawSelection(),
        dropCursor(),
        autocompletion(),
        history(),
        theme,
        EditorView.lineWrapping,
        attachments({ transferAttachment }),
        fileDropHandler(),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        toolbarPositionFix,
    ]

    if (placeholder) {
        exts.push(placeholderExt(placeholder))
    }

    if (vimModeEnabled) {
        exts.push(vim())
    }

    if (autocomplete?.tags) {
        exts.push(tagAutoComplete(autocomplete.tags))
    }

    return exts
}
