import { browser, localeFrom } from "@nanostores/i18n"
import { computed } from "nanostores"
import { $lang, supportedLanguages } from "./langauges"
import type { supportedRegions } from "./regions"
import { $region } from "./regions"

export type Locale =
    `${(typeof supportedLanguages)[number]}-${(typeof supportedRegions)[number]}`

export const $locale = localeFrom(
    computed(
        [$lang, $region],
        (lang = "en", region = "gb") => `${lang}-${region}`,
    ),
    browser({ available: supportedLanguages, fallback: "en-gb" }),
)
