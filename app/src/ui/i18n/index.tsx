import { createContext, useContext, useMemo } from "react"

import { DEFAULT_SETTINGS } from "@/domain/Settings"
import {
    type DateTimeLocale,
    type Language,
    type Region,
    type Translation,
    fallback,
    fallbackDateTimeLocale,
    format,
} from "@/lib/i18n"

export { differenceInCalendarDays } from "@/lib/i18n"

export interface I18nContext {
    language: Language
    region: Region
    translations: Translation
    datetime: DateTimeLocale
}

const i18nContext = createContext<I18nContext>({
    language: DEFAULT_SETTINGS.locale.language,
    region: DEFAULT_SETTINGS.locale.region,
    translations: fallback,
    datetime: fallbackDateTimeLocale,
})

export const I18nProvider = i18nContext.Provider

export function useT<K extends keyof Translation>(
    component: K,
): Translation[K] {
    let ctx = useContext(i18nContext)
    return useMemo(
        () => ctx.translations[component],
        [component, ctx.translations],
    )
}

export function useFormat() {
    let ctx = useContext(i18nContext)
    return useMemo(
        () => format(ctx.region, ctx.datetime),
        [ctx.region, ctx.datetime],
    )
}

export function useDateTimeLocale() {
    let ctx = useContext(i18nContext)
    return ctx.datetime
}
