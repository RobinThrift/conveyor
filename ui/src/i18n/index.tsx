import type { Translation } from "@/i18n/translations"
import { slice as i18nSlice } from "@/state/global/i18n"
import type { RootState } from "@/state/rootStore"
import { useMemo } from "react"
import { useSelector } from "react-redux"
import type { Language } from "./langauges"
import type { Region } from "./regions"

export type Locale = `${Language}-${Region}`

export { supportedLanguages, type Language } from "./langauges"
export { supportedRegions, type Region } from "./regions"

export {
    type Locale as DateFnsLocale,
    fallback as dateFnsFallback,
    loadDateFnsLocale,
} from "./date-fns"

export { useFormat } from "./format"

export function useT<K extends keyof Translation>(
    component: K,
): Translation[K] {
    let selector = useMemo(
        () => (state: RootState) =>
            state["global.i18n"].translations[component],
        [component],
    )
    let translations = useSelector(selector)
    return translations
}

export function useDateFnsLocale() {
    return useSelector(i18nSlice.selectors.dateFns)
}
