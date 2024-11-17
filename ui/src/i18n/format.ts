import { formatter } from "@nanostores/i18n"
import { useStore } from "@nanostores/react"
import { locale } from "./locales"

export const format = formatter(locale)

export function useFormat() {
    return useStore(format)
}
