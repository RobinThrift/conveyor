import {
    defaultSettingsQuietlight,
    quietlightInit,
} from "@uiw/codemirror-theme-quietlight"
import {
    defaultSettingsTokyoNight,
    tokyoNightInit,
} from "@uiw/codemirror-theme-tokyo-night"

export const light = {
    foreground: defaultSettingsQuietlight.foreground,
    background: defaultSettingsQuietlight.background,
    cm: quietlightInit({
        settings: { background: "rgb(var(--surface-bg))" },
    }),
}

export const dark = {
    foreground: defaultSettingsTokyoNight.foreground,
    background: defaultSettingsTokyoNight.background,
    cm: tokyoNightInit({
        settings: { background: "rgb(var(--surface-bg))" },
    }),
}
