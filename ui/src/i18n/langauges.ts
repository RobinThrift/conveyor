import { settingsStore } from "@/storage/settings"
import { computed } from "nanostores"

export const supportedLanguages = ["en", "de"]

const $store = computed(
    settingsStore.$values,
    (settings) => settings.locale.language,
)

export const $lang = {
    ...$store,
    set: (r: (typeof supportedLanguages)[number]) => {
        settingsStore.set("locale.language", r)
    },
}
