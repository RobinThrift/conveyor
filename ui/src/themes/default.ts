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
        settings: { background: "rgb(var(--surface-bg))" },
        styles: [
            {
                tag: t.heading,
                fontWeight: "600",
                color: quietlightPalette.heading,
            },
            {
                tag: t.heading1,
                fontSize: "2.25em",
                fontWeight: "800",
                color: quietlightPalette.heading,
            },
            {
                tag: t.heading2,
                fontSize: "1.5em",
                fontWeight: "700",
                color: quietlightPalette.heading,
            },
            {
                tag: t.heading3,
                fontSize: "1.25em",
                fontWeight: "600",
                color: quietlightPalette.heading,
            },
            {
                tag: t.heading4,
                fontWeight: "700",
                color: quietlightPalette.heading,
            },
            {
                tag: t.heading5,
                fontWeight: "600",
                color: quietlightPalette.heading,
            },
            {
                tag: t.heading6,
                fontWeight: "600",
                color: quietlightPalette.heading,
            },

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
        settings: { background: "rgb(var(--surface-bg))" },
        styles: [
            {
                tag: t.heading,
                fontWeight: "600",
                color: "#89ddff",
            },
            {
                tag: t.heading1,
                fontSize: "2.25em",
                fontWeight: "800",
                color: "#89ddff",
            },
            {
                tag: t.heading2,
                fontSize: "1.5em",
                fontWeight: "700",
                color: "#89ddff",
            },
            {
                tag: t.heading3,
                fontSize: "1.25em",
                fontWeight: "600",
                color: "#89ddff",
            },
            {
                tag: t.heading4,
                fontWeight: "700",
                color: "#89ddff",
            },
            {
                tag: t.heading5,
                fontWeight: "600",
                color: "#89ddff",
            },
            {
                tag: t.heading6,
                fontWeight: "600",
                color: "#89ddff",
            },

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
