import type { supportedLanguages, supportedRegions } from "@/i18n"

export type Settings = {
    locale: {
        language: (typeof supportedLanguages)[number]
        region: (typeof supportedRegions)[number]
    }
    theme: {
        colourScheme: "default"
        mode: "auto" | "light" | "dark"
        icon: string
    }
    controls: {
        vim: boolean
        doubleClickToEdit: boolean
    }
}
