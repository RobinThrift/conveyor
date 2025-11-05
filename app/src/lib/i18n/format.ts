import { Temporal } from "temporal-polyfill"
import type { Region } from "./regions"

const regionFixed: Partial<Record<Region, string>> = {
    gb: "en-gb",
    us: "en-us",
}

export function getFixedRegion(region: Region) {
    return regionFixed[region] || region
}

export function format(region: Region) {
    let code = getFixedRegion(region)
    return {
        number(num: number, opts?: Intl.NumberFormatOptions) {
            return new Intl.NumberFormat(code, opts).format(num)
        },

        formatDateTime(
            date: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
            opts?: Intl.DateTimeFormatOptions,
        ) {
            if (date instanceof Temporal.PlainDateTime) {
                date = date.toZonedDateTime(Temporal.Now.timeZoneId())
            }
            return date.toLocaleString(code, { ...opts })
        },

        formatRelative: <
            D extends Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
        >(
            laterDate: D,
            earlierDate: D,
            opts?: Intl.DateTimeFormatOptions,
        ): { date: string; time: string } => {
            let timeZoneID = Temporal.Now.timeZoneId()

            let zonedEarlier: Temporal.ZonedDateTime =
                earlierDate instanceof Temporal.PlainDate ||
                earlierDate instanceof Temporal.PlainDateTime
                    ? earlierDate.toZonedDateTime(timeZoneID)
                    : earlierDate.withTimeZone(timeZoneID)
            let zonedLater: Temporal.ZonedDateTime =
                laterDate instanceof Temporal.PlainDate ||
                laterDate instanceof Temporal.PlainDateTime
                    ? laterDate.toZonedDateTime(timeZoneID)
                    : laterDate.withTimeZone(timeZoneID)

            return formatDistanceDateTime(zonedLater, zonedEarlier, code, opts)
        },
    }
}

function formatDistanceDateTime(
    laterDate: Temporal.ZonedDateTime,
    earlierDate: Temporal.ZonedDateTime,
    code: string,
    opts?: Intl.DateTimeFormatOptions,
): { date: string; time: string } {
    let diff = laterDate.since(earlierDate, { largestUnit: "day" }).abs()

    let formatted: string
    if (diff.days === 0) {
        if (diff.hours !== 0) {
            formatted = new Intl.RelativeTimeFormat(code, {
                style: "short",
                numeric: "auto",
            }).format(-diff.hours, "hour")
        } else if (diff.minutes !== 0) {
            formatted = new Intl.RelativeTimeFormat(code, {
                style: "short",
                numeric: "auto",
            }).format(Math.round(-diff.minutes), "minute")
        } else {
            formatted = new Intl.RelativeTimeFormat(code, {
                style: "short",
                numeric: "auto",
            }).format(Math.round(-diff.seconds), "second")
        }
    } else if (diff.days <= 3) {
        formatted = new Intl.RelativeTimeFormat(code, {
            style: "long",
            numeric: "auto",
        }).format(-diff.days, "day")
    } else {
        formatted = earlierDate.withTimeZone(laterDate.timeZoneId).toLocaleString(code, {
            dateStyle: "long",
            ...opts,
            timeStyle: undefined,
        })
    }

    return {
        date: formatted,
        time: earlierDate.withTimeZone(laterDate.timeZoneId).toLocaleString(code, {
            timeStyle: "short",
            ...opts,
            dateStyle: undefined,
        }),
    }
}
