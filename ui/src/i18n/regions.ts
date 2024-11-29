import { settingsStore } from "@/storage/settings"
import { computed } from "nanostores"

export const supportedRegions = ["gb", "us", "de"] as const

const $store = computed(
    settingsStore.$values,
    (settings) => settings.locale.region,
)

export const $region = {
    ...$store,
    set: (r: (typeof supportedRegions)[number]) => {
        settingsStore.set("locale.region", r)
    },
}
