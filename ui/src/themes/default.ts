import { tags as t } from "@lezer/highlight"
import {
    defaultSettingsQuietlight,
    quietlightInit,
} from "@uiw/codemirror-theme-quietlight"
import { config as quietlightPalette } from "@uiw/codemirror-theme-quietlight/esm/color"
import {
    defaultSettingsTokyoNight,
    tokyoNightInit,
} from "@uiw/codemirror-theme-tokyo-night"

export const light = {
    foreground: defaultSettingsQuietlight.foreground,
    background: defaultSettingsQuietlight.background,
    cm: quietlightInit({
        settings: {
            background: "rgb(var(--surface-bg))",
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

            {
                tag: [
                    t.processingInstruction,
                    t.string,
                    t.inserted,
                    t.special(t.string),
                ],
                color: quietlightPalette.string,
            },
        ],
    }),
}

export const dark = {
    foreground: defaultSettingsTokyoNight.foreground,
    background: defaultSettingsTokyoNight.background,
    cm: tokyoNightInit({
        settings: {
            background: "rgb(var(--surface-bg))",
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

            {
                tag: [
                    t.processingInstruction,
                    t.string,
                    t.inserted,
                    t.special(t.string),
                ],
                color: "#9ece6a",
            },
        ],
    }),
}
