import type { ComponentsJSON } from "@nanostores/i18n"
import type { translations } from "./en"

export const translationFiles = import.meta.glob<
    boolean,
    string,
    { default: ComponentsJSON }
>("../../../translations/*.json")

export { translations as fallback } from "./en"

export type Translation = typeof translations
