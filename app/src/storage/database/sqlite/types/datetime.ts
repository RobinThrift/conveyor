import { CalendarDateTime } from "@/lib/i18n"

export function dateFromSQLite(value: null): null
export function dateFromSQLite(value: string): Date
export function dateFromSQLite(value: string | null): Date | null {
    if (!value) {
        return null
    }
    return parse(value)
}

export function dateToSQLite(value: Date | CalendarDateTime | string | undefined): string | null {
    if (!value) {
        return null
    }

    let d = value
    if (d instanceof CalendarDateTime) {
        d = (value as CalendarDateTime).toDate("UTC")
    } else if (typeof d === "string") {
        d = new Date(value as string)
    }
    return format(d)
}

// "yyyy-MM-dd HH:mm:ss'Z'"
function parse(date: string): Date {
    let end = date.lastIndexOf("Z")
    let [year, month, day] = date.substring(0, 10).split("-")
    let [hours, minutes, seconds] = date.substring(11, end).split(":")

    return new Date(
        Date.UTC(
            Number.parseInt(year),
            Number.parseInt(month) - 1,
            Number.parseInt(day),
            Number.parseInt(hours),
            Number.parseInt(minutes),
            Number.parseInt(seconds),
        ),
    )
}

// "yyyy-MM-dd HH:mm:ss'Z'"
function format(date: Date): string {
    return date.toISOString().replace("T", " ")
}
