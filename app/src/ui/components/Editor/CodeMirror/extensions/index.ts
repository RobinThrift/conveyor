import { autocompletion, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete"
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
    drawSelection,
    dropCursor,
    EditorView,
    keymap,
    placeholder as placeholderExt,
} from "@codemirror/view"

import type { AttachmentID } from "@/domain/Attachment"
import type { Tag } from "@/domain/Tag"
import { customBlocks } from "@/lib/markdown/extensions/blocks"
import { footnotes } from "@/lib/markdown/extensions/footnotes"
import { tagLinks } from "@/lib/markdown/extensions/tags"
import type { AsyncResult } from "@/lib/result"
import { attachments } from "./attachments"
import { fileDropHandler } from "./fileDropHandler"
import { inlineImages } from "./inlineImages"
import { markdownDecorations } from "./markdownDecorations"
import { tabIndent } from "./tabIndent"
import { tagAutoComplete } from "./tagAutoComplete"
import { theme } from "./theme"
import { vim } from "./vim"

export const extensions = ({
    placeholder,
    autocomplete,
    vimModeEnabled,
    transferAttachment,
    getAttachmentDataByID,
}: {
    placeholder?: string
    autocomplete?: {
        tags?: Tag[]
    }
    vimModeEnabled?: boolean
    transferAttachment(attachment: {
        id: AttachmentID
        filename: string
        data: Uint8Array
    }): Promise<void>
    getAttachmentDataByID(id: AttachmentID): AsyncResult<{ data: Uint8Array }>
}) => {
    let exts: Extension[] = [
        vimModeEnabled ? vim() : [],
        keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...searchKeymap]),
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
        markdown({
            base: markdownLanguage,
            codeLanguages: languages,
            extensions: [footnotes, tagLinks, customBlocks],
        }),
        inlineImages(getAttachmentDataByID),
        markdownDecorations,
        EditorView.contentAttributes.of({
            spellcheck: "true",
        }),
        tabIndent,
    ]

    if (placeholder) {
        exts.push(placeholderExt(placeholder))
    }

    if (autocomplete?.tags) {
        exts.push(tagAutoComplete(autocomplete.tags))
    }

    return exts
}
