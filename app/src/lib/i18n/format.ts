import type { DateTimeLocale } from "./datetime"
import type { Region } from "./regions"

import { formatDistance } from "date-fns"

const regionFixed: Partial<Record<Region, string>> = {
    gb: "en-gb",
    us: "en-us",
}

export function format(region: Region, datetime?: DateTimeLocale) {
    let code = regionFixed[region] || region
    return {
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

        formatDistance: (
            laterDate: Date,
            earlierDate: Date,
            options?: { addSuffix?: boolean },
        ) => {
            return formatDistance(laterDate, earlierDate, {
                locale: datetime,
                addSuffix: options?.addSuffix,
            })
        },
    }
}
