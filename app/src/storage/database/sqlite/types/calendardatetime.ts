import {
    type CalendarDate,
    type CalendarDateTime,
    parseDateTimeISO8601,
    toCalendarDateTime,
} from "@/lib/i18n"

export function calendarDateTimeFromSQLite(value: null): null
export function calendarDateTimeFromSQLite(value: string): CalendarDateTime
export function calendarDateTimeFromSQLite(
    value: string | null,
): CalendarDateTime | null {
    if (!value) {
        return null
    }
    return parseDateTimeISO8601(
        value.replace(" ", "T").substring(0, value.length - 1),
    )
}

export function calendarDateTimeToSQLite(
    value: CalendarDate | CalendarDateTime | string | undefined,
): string | null {
    if (!value) {
        return null
    }

    let d = value
    if (typeof d === "string") {
        let strValue = value as string
        d = parseDateTimeISO8601(
            strValue.replace(" ", "T").substring(0, strValue.length - 1),
        )
    }

    if ("calendar" in d && !("second" in d)) {
        d = toCalendarDateTime(d).set({ hour: 23, minute: 59, second: 59 })
    }

    return `${d.toString().replace("T", " ")}Z`
}
