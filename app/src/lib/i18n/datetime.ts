import { Temporal } from "temporal-polyfill"

export type DateLike = Date | Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime

export function currentDateTime() {
    return Temporal.Now.zonedDateTimeISO()
}

export function currentDate() {
    return Temporal.Now.plainDateISO()
}

export function calendarDateFromDate(date: Date) {
    return new Temporal.PlainDate(date.getFullYear(), date.getMonth(), date.getDate())
}

export function calendarDateTimeFromDate(date: Date): Temporal.ZonedDateTime
export function calendarDateTimeFromDate(date: Temporal.PlainDate): Temporal.PlainDateTime
export function calendarDateTimeFromDate(date: Temporal.PlainDateTime): Temporal.PlainDateTime
export function calendarDateTimeFromDate(date: Temporal.ZonedDateTime): Temporal.ZonedDateTime
export function calendarDateTimeFromDate(
    date: Date | Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
) {
    if (typeof date !== "object") {
        throw new Error(`invalid datetime: ${date}`)
    }

    if (date instanceof Date) {
        return Temporal.ZonedDateTime.from({
            day: date.getUTCDate(),
            month: date.getUTCMonth() + 1,
            year: date.getUTCFullYear(),
            hour: date.getUTCHours(),
            minute: date.getUTCMinutes(),
            second: date.getUTCSeconds(),
            timeZone: "utc",
        })
    }

    if (date instanceof Temporal.PlainDate) {
        return Temporal.PlainDateTime.from({
            ...date,
            hour: 0,
            minute: 0,
            second: 0,
        })
    }

    return date
}

// resturns true if a is after b
export function isAfter(
    a: Date | Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
    b: Date | Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
) {
    let first = a instanceof Date ? calendarDateTimeFromDate(a) : a
    let second = b instanceof Date ? calendarDateTimeFromDate(b) : b
    return Temporal.ZonedDateTime.compare(first, second) > 0
}

export function differenceInCalendarDays(
    a: Date | Temporal.PlainDate | Temporal.PlainDateTime,
    b: Temporal.PlainDate | Temporal.PlainDateTime,
) {
    let first = a instanceof Date ? calendarDateTimeFromDate(a) : a
    return b.since(first).abs().days
}

export function roundToNearestMinutes<D extends Temporal.PlainDateTime | Temporal.ZonedDateTime>(
    d: D,
): D {
    return d.round("minute") as D
}

export function parseDateISO8601(s: string): Temporal.PlainDate {
    return Temporal.PlainDate.from(s)
}

export function isSameDay(
    a: Temporal.PlainDate | Temporal.PlainDateTime,
    b: Temporal.PlainDate | Temporal.PlainDateTime,
): boolean {
    if (a instanceof Temporal.PlainDateTime) {
        a = a.toPlainDate()
    }

    if (b instanceof Temporal.PlainDateTime) {
        b = b.toPlainDate()
    }

    return a.since(b).abs().days === 0
}

export function isSameMonth(
    a: Temporal.PlainDate | Temporal.PlainDateTime,
    b: Temporal.PlainDate | Temporal.PlainDateTime,
): boolean {
    return a.month === b.month
}

export function temporalToDate(
    d: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
): Date {
    if (d instanceof Temporal.PlainDate) {
        return new Date(d.year, d.month - 1, d.day, 0, 0, 0, 0)
    }

    if (d instanceof Temporal.PlainDateTime) {
        d = d.toZonedDateTime("utc")
        return new Date(
            Date.UTC(d.year, d.month - 1, d.day, d.hour, d.minute, d.second, d.millisecond),
        )
    }

    d = d.withTimeZone("utc")

    return new Date(Date.UTC(d.year, d.month - 1, d.day, d.hour, d.minute, d.second, d.millisecond))
}
