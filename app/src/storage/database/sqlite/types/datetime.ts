import { Temporal } from "temporal-polyfill"

export function dateFromSQLite(value: null): null
export function dateFromSQLite(value: string): Temporal.ZonedDateTime
export function dateFromSQLite(value: string | null): Temporal.ZonedDateTime | null {
    if (!value) {
        return null
    }
    return parse(value)
}

export function dateToSQLite(
    value: Temporal.PlainDateTime | Temporal.ZonedDateTime | string | undefined,
): string | null {
    if (!value) {
        return null
    }

    let d = value
    if (d instanceof Temporal.PlainDateTime) {
        d = d.toZonedDateTime(Temporal.Now.timeZoneId())
    } else if (d instanceof Temporal.PlainDate) {
        d = d.toZonedDateTime({ timeZone: Temporal.Now.timeZoneId(), plainTime: { hour: 12 } })
    } else if (typeof d === "string") {
        d = Temporal.ZonedDateTime.from(value)
    }

    return format(d)
}

// "yyyy-MM-dd HH:mm:ss'Z'"
function parse(date: string): Temporal.ZonedDateTime {
    let end = date.lastIndexOf("Z")
    let [year, month, day] = date.substring(0, 10).split("-")
    let [hours, minutes, seconds] = date.substring(11, end).split(":")

    return Temporal.ZonedDateTime.from({
        year: Number.parseInt(year, 10),
        month: Number.parseInt(month, 10),
        day: Number.parseInt(day, 10),
        hour: Number.parseInt(hours, 10),
        minute: Number.parseInt(minutes, 10),
        second: Number.parseInt(seconds, 10),
        timeZone: "utc",
    })
}

// "yyyy-MM-dd HH:mm:ss'Z'"
function format(date: Temporal.ZonedDateTime): string {
    let utc = date.withTimeZone("utc")
    return `${utc.year}-${utc.month.toString().padStart(2, "0")}-${utc.day.toString().padStart(2, "0")} ${utc.hour.toString().padStart(2, "0")}:${utc.minute.toString().padStart(2, "0")}:${utc.second.toString().padStart(2, "0")}Z`
}
