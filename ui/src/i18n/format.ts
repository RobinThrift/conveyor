import { useRegion } from "@/state/i18n"
import { useMemo } from "react"
import type { supportedRegions } from "./regions"

const regionFixed: Partial<Record<(typeof supportedRegions)[number], string>> =
    {
        gb: "en-gb",
        us: "en-us",
    }

export function useFormat() {
    let region = useRegion()
    let code = regionFixed[region] || "en-gb"
    return useMemo(
        () => ({
            number(num: number, opts?: Intl.NumberFormatOptions) {
                return new Intl.NumberFormat(code, opts).format(num)
            },
            relativeTime(
                num: number,
                unit: Intl.RelativeTimeFormatUnit,
                opts?: Intl.RelativeTimeFormatOptions,
            ) {
                return new Intl.RelativeTimeFormat(code, opts).format(num, unit)
            },
            time(date?: Date | number, opts?: Intl.DateTimeFormatOptions) {
                return new Intl.DateTimeFormat(code, opts).format(date)
            },
        }),
        [code],
    )
}
