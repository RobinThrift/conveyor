import type { Language } from "./langauges"
import type { Region } from "./regions"

export type Locale = `${Language}-${Region}`

export { supportedLanguages, type Language } from "./langauges"
export { supportedRegions, type Region } from "./regions"

export { useT, useDateFnsLocale } from "../state/i18n"
export {
    type Locale as DateFnsLocale,
    fallback as dateFnsFallback,
    loadDateFnsLocale,
} from "./date-fns"

export { useFormat } from "./format"
