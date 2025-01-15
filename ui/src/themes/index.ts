import type { Settings } from "@/domain/Settings"
import type { Extension } from "@codemirror/state"
import * as d from "./default"
import * as rosepine from "./rosepine"
import * as warm from "./warm"

export type ThemeMode = {
    foreground?: string
    background?: string
    cm: Extension
}

export type Theme = {
    light: ThemeMode
    dark: ThemeMode
}

export const themes: Record<Settings["theme"]["colourScheme"], Theme> = {
    default: d,
    warm: warm,
    rosepine,
}
