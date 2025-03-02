import type { Language, Region } from "@/lib/i18n"

export type Settings = {
    locale: {
        language: Language
        region: Region
    }
    theme: {
        colourScheme: "default" | "warm" | "rosepine"
        mode: "auto" | "light" | "dark"
        icon: string
        listLayout: "masonry" | "single" | "ultra-compact"
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

    theme: {
        colourScheme: "default",
        mode: "auto",
        icon: "default",
        listLayout: "masonry",
    },

    controls: {
        vim: true,
        doubleClickToEdit: true,
    },
}
