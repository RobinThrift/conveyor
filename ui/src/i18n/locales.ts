import { browser, localeFrom } from "@nanostores/i18n"
import { persistentAtom } from "@nanostores/persistent"

export const supportedLocales = ["en-gb"]

export const localeSettings = persistentAtom<string | undefined>("belt.locale")

export const locale = localeFrom(
    localeSettings,
    browser({ available: supportedLocales, fallback: "en-gb" }),
)
