import { createI18n } from "@nanostores/i18n"
import { useStore } from "@nanostores/react"
import { locale } from "./locales"
import { type Translation, fallback, translationFiles } from "./translations"

export const i18n = createI18n(locale, {
    get(code) {
        if (code === "en-gb") {
            return Promise.resolve({
                default: fallback,
            }) as any
        }
        return translationFiles[`../../../translations/${code}.json`]()
    },
})

export function useT<K extends keyof Translation>(
    component: K,
): Translation[K] {
    return useStore(i18n(component, fallback[component]))
}

export { useLocale } from "./date-fns"
export { useFormat } from "./format"
