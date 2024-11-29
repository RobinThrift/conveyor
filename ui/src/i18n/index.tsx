import {
    type ComponentsJSON,
    type Messages,
    createI18n,
    messagesToJSON,
} from "@nanostores/i18n"
import { useStore } from "@nanostores/react"
import { useMemo } from "react"
import { $locale } from "./locales"
import { type Translation, fallback, translationFiles } from "./translations"

export { $lang, supportedLanguages } from "./langauges"
export { $region, supportedRegions } from "./regions"
export { $locale } from "./locales"

let fallbackMsgs: ComponentsJSON | undefined

export const i18n = createI18n($locale, {
    async get(code) {
        let [lang, _] = code.split("-")

        let load =
            translationFiles[`../../../translations/${code}.json`] ||
            translationFiles[`../../../translations/${lang}.json`]
        if (!load) {
            if (!fallbackMsgs) {
                let msgs = []
                for (let component in fallback) {
                    let k = component as keyof typeof fallback
                    msgs.push(i18n(component, fallback[k]))
                }

                fallbackMsgs = messagesToJSON(...msgs)
            }
            return fallbackMsgs
        }

        let mod = await load()
        return mod.default
    },
})

let tanslationStores = new Map<
    keyof Translation,
    Messages<Translation[keyof Translation]>
>()

function getTranslationStore<K extends keyof Translation>(
    component: K,
): Messages<Translation[K]> {
    let store = tanslationStores.get(component)
    if (store) {
        return store as Messages<Translation[K]>
    }

    store = i18n(component, fallback[component])

    tanslationStores.set(component, store)

    return store as Messages<Translation[K]>
}

export function useT<K extends keyof Translation>(
    component: K,
): Translation[K] {
    let store = useMemo(() => getTranslationStore(component), [component])
    return useStore(store)
}

export { useLocale as useDateFnsLocale } from "./date-fns"
export { useFormat } from "./format"
