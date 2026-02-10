import { HighlightStyle, syntaxHighlighting, type TagStyle } from "@codemirror/language"
import { EditorView } from "@codemirror/view"
import { classHighlighter, tags as t } from "@lezer/highlight"

import { TagLinkTag } from "@/lib/markdown/extensions/tags"

let styles: TagStyle[] = [
    { tag: t.heading, class: "cm-heading" },
    { tag: t.heading1, class: "cm-heading-1" },
    { tag: t.heading2, class: "cm-heading-2" },
    { tag: t.heading3, class: "cm-heading-3" },
    { tag: t.heading4, class: "cm-heading-4" },
    { tag: t.heading5, class: "cm-heading-5" },
    { tag: t.heading6, class: "cm-heading-6" },
    {
        tag: TagLinkTag,
        class: "tok-tag-link",
    },
]

const themeExtension = EditorView.theme({
    "& .cm-content": {
        caretColor: "var(--code-foreground)",
    },

    "& .cm-cursor": {
        borderLeftColor: "var(--code-foreground)",
    },

    "& .cm-matchingBracket:has(.tok-heading)": {
        display: "inline-block",
        maxHeight: "min-content",
    },

    "& .cm-scroller": {
        height: "100% !important",
    },

    "&.cm-focused .cm-selectionBackground, & .cm-line::selection, &.cm-focused .cm-content ::selection, .cm-content ::selection":
        {
            color: "var(--code-selection-foreground) !important",
            background: "var(--code-selection-background) !important",
            opacity: 1,
        },

    "& .cm-selectionBackground": {
        color: "var(--code-selection-foreground) !important",
        background: "var(--code-selection-background) !important",
        opacity: 0.5,
    },
})

export const theme = [
    themeExtension,
    syntaxHighlighting(classHighlighter),
    syntaxHighlighting(HighlightStyle.define(styles)),
]
