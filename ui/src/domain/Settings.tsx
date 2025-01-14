import type { supportedLanguages, supportedRegions } from "@/i18n"

export type Settings = {
    locale: {
        language: (typeof supportedLanguages)[number]
        region: (typeof supportedRegions)[number]
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
