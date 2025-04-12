export {
    CalendarDate,
    CalendarDateTime,
    getLocalTimeZone,
    isSameDay,
    isSameMonth,
    toCalendarDateTime,
    toCalendarDate,
    parseDate as parseDateISO8601, // ISO8601: yyyy-MM-dd
    parseDateTime as parseDateTimeISO8601, // ISO8601: yyyy-MM-dd'T'HH:mm:ss with no time zone
} from "@internationalized/date"

import {
    type CalendarDate,
    type CalendarDateTime,
    today as _currentDate,
    now as _currentDateTime,
    fromDate,
    getLocalTimeZone,
    toCalendarDate,
    toCalendarDateTime,
} from "@internationalized/date"

export function currentDateTime() {
    return toCalendarDateTime(_currentDateTime(getLocalTimeZone()))
}

export function currentDate() {
    return _currentDate(getLocalTimeZone())
}

export function calendarDateFromDate(date: Date): CalendarDate {
    return toCalendarDate(fromDate(date, getLocalTimeZone()))
}

export function calendarDateTimeFromDate(date: Date): CalendarDateTime {
    if ("calendar" in date && "hour" in date) {
        return date as unknown as CalendarDateTime
    }
    return toCalendarDateTime(fromDate(date, getLocalTimeZone()))
}

export function isAfter(
    a: Date | CalendarDateTime | CalendarDate,
    b: Date | CalendarDateTime | CalendarDate,
) {
    let first = a instanceof Date ? calendarDateTimeFromDate(a) : a
    let second = b instanceof Date ? calendarDateTimeFromDate(b) : b
    return first.compare(second) > 0
}

export function differenceInCalendarDays(
    a: Date | CalendarDateTime | CalendarDate,
    b: CalendarDateTime | CalendarDate,
) {
    let first = a instanceof Date ? calendarDateTimeFromDate(a) : a
    return Math.abs(
        first.calendar.toJulianDay(first) - b.calendar.toJulianDay(b),
    )
}

export function roundToNearestMinutes(d: CalendarDateTime) {
    if (d.second >= 30) {
        return d.set({ second: 0, millisecond: 0 }).cycle("minute", 1)
    }

    return d.set({ second: 0, millisecond: 0 })
}
