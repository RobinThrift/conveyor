import { createContext } from "react"

import { DEFAULT_SETTINGS } from "@/domain/Settings"
import {
    type Language,
    type Region,
    type Translation,
    fallback,
    getLocalTimeZone,
} from "@/lib/i18n"

export interface I18nContext {
    language: Language
    region: Region
    translations: Translation
    timeZone: string
}

export const i18nContext = createContext<I18nContext>({
    language: DEFAULT_SETTINGS.locale.language,
    region: DEFAULT_SETTINGS.locale.region,
    translations: fallback,
    timeZone: getLocalTimeZone(),
})

export const I18nProvider = i18nContext.Provider
