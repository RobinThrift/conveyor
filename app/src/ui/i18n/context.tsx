import { useStore } from "@tanstack/react-store"
import React, { createContext, startTransition, useState } from "react"

import { DEFAULT_SETTINGS } from "@/domain/Settings"
import {
    fallback,
    getLocalTimeZone,
    type Language,
    loadTranslation,
    type Region,
    resolveTranslation,
    type Translation,
} from "@/lib/i18n"
import { selectors, stores } from "@/ui/stores"

export interface I18nContext {
    language: Language
    region: Region
    translations: Translation
    timeZone: string
}

const DEFAULT_I18N_CONTEXT: I18nContext = {
    language: DEFAULT_SETTINGS.locale.language,
    region: DEFAULT_SETTINGS.locale.region,
    translations: fallback,
    timeZone: getLocalTimeZone(),
}

export const i18nContext = createContext<I18nContext>(DEFAULT_I18N_CONTEXT)

export function I18nProvider(props: React.PropsWithChildren<{ value?: I18nContext }>) {
    let language = useStore(stores.settings.values, selectors.settings.value("locale.language"))
    let region = useStore(stores.settings.values, selectors.settings.value("locale.region"))
    let [value, setValue] = useState<I18nContext>(props.value ?? DEFAULT_I18N_CONTEXT)

    if (value.language !== language || value.region !== region) {
        setValue((value) => ({
            ...value,
            language,
            region,
        }))
        startTransition(async () => {
            let translationJSON = await loadTranslation(`${language}-${region}`)

            let translations: ReturnType<typeof resolveTranslation> | undefined
            if (translationJSON) {
                translations = resolveTranslation(`${language}-${region}`, translationJSON)
            }

            if (translations) {
                setValue((value) => ({
                    ...value,
                    translations,
                }))
            }
        })
    }

    return <i18nContext.Provider value={value}>{props.children}</i18nContext.Provider>
}
