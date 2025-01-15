import { tags as t } from "@lezer/highlight"
import { createTheme } from "@uiw/codemirror-themes"

const palette = {
    light: {
        backgound: "#faf4ed",
        foreground: "#575279",
        muted: "#9893a5",
        subtle: "#797593",
        love: "#b4637a",
        gold: "#ea9d34",
        rose: "#d7827e",
        pine: "#286983",
        foam: "#56949f",
        iris: "#907aa9",
    },

    dark: {
        backgound: "#191724",
        foreground: "#e0def4",
        muted: "#6e6a86",
        subtle: "#908caa",
        love: "#eb6f92",
        gold: " #f6c177",
        rose: "#ebbcba",
        pine: "#31748f",
        foam: "#9ccfd8",
        iris: "#c4a7e7",
    },
}

export const light = {
    background: palette.light.backgound,
    foreground: palette.light.foreground,
    cm: createTheme({
        theme: "light",
        settings: {
            fontFamily: "var(--font-monospace)",
            fontSize: "var(--editor-font-size)",
        },
        styles: [
            { tag: t.heading, class: "cm-heading" },
            { tag: t.heading1, class: "cm-heading-1" },
            { tag: t.heading2, class: "cm-heading-2" },
            { tag: t.heading3, class: "cm-heading-3" },
            { tag: t.heading4, class: "cm-heading-4" },
            { tag: t.heading5, class: "cm-heading-5" },
            { tag: t.heading6, class: "cm-heading-6" },

            { tag: t.keyword, color: palette.light.rose },
            {
                tag: [t.name, t.deleted, t.character, t.macroName],
                color: palette.light.iris,
            },
            { tag: [t.propertyName], color: palette.light.foreground },
            {
                tag: [t.function(t.variableName), t.labelName],
                color: palette.light.foreground,
            },
            {
                tag: [t.color, t.constant(t.name), t.standard(t.name)],
                color: palette.light.gold,
            },
            { tag: [t.className, t.typeName], color: palette.light.foam },
            {
                tag: [
                    t.number,
                    t.changed,
                    t.annotation,
                    t.modifier,
                    t.self,
                    t.namespace,
                ],
                color: palette.light.rose,
            },
            { tag: [t.operator, t.operatorKeyword], color: palette.light.pine },
            {
                tag: [t.url, t.escape, t.regexp, t.link],
                color: palette.light.love,
            },
            { tag: [t.meta, t.comment], color: palette.light.subtle },

            {
                tag: [t.atom, t.bool, t.special(t.variableName)],
                color: palette.light.love,
            },

            { tag: t.invalid, color: palette.light.love },

            {
                tag: [
                    t.processingInstruction,
                    t.string,
                    t.inserted,
                    t.special(t.string),
                ],
                color: palette.light.gold,
            },
        ],
    }),
}

export const dark = {
    background: palette.dark.backgound,
    foreground: palette.dark.foreground,
    cm: createTheme({
        theme: "dark",
        settings: {
            fontFamily: "var(--font-monospace)",
            fontSize: "var(--editor-font-size)",
        },
        styles: [
            { tag: t.heading, class: "cm-heading" },
            { tag: t.heading1, class: "cm-heading-1" },
            { tag: t.heading2, class: "cm-heading-2" },
            { tag: t.heading3, class: "cm-heading-3" },
            { tag: t.heading4, class: "cm-heading-4" },
            { tag: t.heading5, class: "cm-heading-5" },
            { tag: t.heading6, class: "cm-heading-6" },

            { tag: t.keyword, color: palette.dark.rose },
            {
                tag: [t.name, t.deleted, t.character, t.macroName],
                color: palette.dark.iris,
            },
            { tag: [t.propertyName], color: palette.dark.foreground },
            {
                tag: [
                    t.processingInstruction,
                    t.string,
                    t.inserted,
                    t.special(t.string),
                ],
                color: palette.dark.gold,
            },
            {
                tag: [t.function(t.variableName), t.labelName],
                color: palette.dark.foreground,
            },
            {
                tag: [t.color, t.constant(t.name), t.standard(t.name)],
                color: palette.dark.gold,
            },
            { tag: [t.className, t.typeName], color: palette.dark.foam },
            {
                tag: [
                    t.number,
                    t.changed,
                    t.annotation,
                    t.modifier,
                    t.self,
                    t.namespace,
                ],
                color: palette.dark.rose,
            },
            { tag: [t.operator, t.operatorKeyword], color: palette.dark.pine },
            {
                tag: [t.url, t.escape, t.regexp, t.link],
                color: palette.dark.love,
            },
            { tag: [t.meta, t.comment], color: palette.dark.subtle },
            {
                tag: [t.atom, t.bool, t.special(t.variableName)],
                color: palette.dark.love,
            },
            { tag: t.invalid, color: palette.dark.love },
        ],
    }),
}
