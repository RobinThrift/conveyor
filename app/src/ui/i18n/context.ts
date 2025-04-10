import { createContext } from "react"

import { DEFAULT_SETTINGS } from "@/domain/Settings"
import {
    type DateTimeLocale,
    type Language,
    type Region,
    type Translation,
    fallback,
    fallbackDateTimeLocale,
    getLocalTimeZone,
} from "@/lib/i18n"

export interface I18nContext {
    language: Language
    region: Region
    translations: Translation
    datetime: DateTimeLocale
    timeZone: string
}

export const i18nContext = createContext<I18nContext>({
    language: DEFAULT_SETTINGS.locale.language,
    region: DEFAULT_SETTINGS.locale.region,
    translations: fallback,
    datetime: fallbackDateTimeLocale,
    timeZone: getLocalTimeZone(),
})

export const I18nProvider = i18nContext.Provider
