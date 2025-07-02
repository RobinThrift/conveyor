import { createSelector } from "@reduxjs/toolkit"
import React, { createContext, startTransition, useState } from "react"

import { DEFAULT_SETTINGS } from "@/domain/Settings"
import {
    type Language,
    type Region,
    type Translation,
    fallback,
    getLocalTimeZone,
    loadTranslation,
    resolveTranslation,
} from "@/lib/i18n"
import { selectors } from "@/ui/state"
import { useSelector } from "react-redux"

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

const i18nSelector = createSelector(
    [
        (state) => selectors.settings.value(state, "locale.language"),
        (state) => selectors.settings.value(state, "locale.region"),
    ],
    (language, region) => ({
        language,
        region,
    }),
)

export function I18nProvider(props: React.PropsWithChildren<{ value?: I18nContext }>) {
    let { language, region } = useSelector(i18nSelector)
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
