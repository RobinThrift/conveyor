import type { Language, Region } from "@/lib/i18n"

export type ColourSchemeNames = "default" | "warm" | "rosepine"
export type ColourSchemeMode = "auto" | "light" | "dark"

type MemoListLayouts = "masonry" | "single" | "ultra-compact"

export type Settings = {
    locale: {
        language: Language
        region: Region
    }

    account: {
        displayName: string
    }

    ui: {
        colourScheme: {
            light: ColourSchemeNames
            dark: ColourSchemeNames
            mode: ColourSchemeMode
        }

        memoList: {
            layout: MemoListLayouts
        }
    }

    controls: {
        vim: boolean
        doubleClickToEdit: boolean
    }
}

export const DEFAULT_SETTINGS: Settings = {
    locale: {
        language: "en",
        region: "gb",
    },

    account: {
        displayName: "User",
    },

    ui: {
        colourScheme: {
            light: "default",
            dark: "default",
            mode: "auto",
        },

        memoList: {
            layout: "masonry",
        },
    },

    controls: {
        vim: false,
        doubleClickToEdit: true,
    },
}
