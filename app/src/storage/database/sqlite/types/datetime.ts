import { UTCDateMini, utc } from "@date-fns/utc"
import { format, parse } from "date-fns"

import { CalendarDateTime } from "@/lib/i18n"

const sqliteDateTimeFormat = "yyyy-MM-dd HH:mm:ss'Z'"

export function dateFromSQLite(value: null): null
export function dateFromSQLite(value: string): Date
export function dateFromSQLite(value: string | null): Date | null {
    if (!value) {
        return null
    }
    return parse(value, sqliteDateTimeFormat, new UTCDateMini())
}

export function dateToSQLite(
    value: Date | CalendarDateTime | string | undefined,
): string | null {
    if (!value) {
        return null
    }

    let d = value
    if (d instanceof CalendarDateTime) {
        d = (value as CalendarDateTime).toDate("UTC")
    } else if (typeof d === "string") {
        d = new Date(value as string)
    }
    return format(d, sqliteDateTimeFormat, { in: utc })
}
