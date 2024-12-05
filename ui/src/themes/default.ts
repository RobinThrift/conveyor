import {
    defaultSettingsQuietlight,
    quietlight,
} from "@uiw/codemirror-theme-quietlight"
import {
    defaultSettingsTokyoNight,
    tokyoNightInit,
} from "@uiw/codemirror-theme-tokyo-night"

export const light = {
    foreground: defaultSettingsQuietlight.foreground,
    background: defaultSettingsQuietlight.background,
    cm: quietlight,
}

export const dark = {
    foreground: defaultSettingsTokyoNight.foreground,
    background: defaultSettingsTokyoNight.background,
    cm: tokyoNightInit({
        settings: { background: "rgb(var(--surface-bg))" },
    }),
}
