import { formatter } from "@nanostores/i18n"
import { useStore } from "@nanostores/react"
import { computed } from "nanostores"
import { $region, type supportedRegions } from "./regions"

const regionFixed: Partial<Record<(typeof supportedRegions)[number], string>> =
    {
        gb: "en-gb",
        us: "en-us",
    }

let $regionWithDefault = computed(
    $region,
    (region = "gb") => regionFixed[region] ?? region,
)

export const $format = formatter($regionWithDefault)

export function useFormat() {
    return useStore($format)
}
