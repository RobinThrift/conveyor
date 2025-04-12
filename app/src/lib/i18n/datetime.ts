import { enGB } from "date-fns/locale"
import type { Locale } from "date-fns/locale"
import { type Region, supportedRegions } from "./regions"

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

export type DateTimeLocale = Locale

const datetimeLocales = import.meta.glob<
    boolean,
    Region,
    { default: DateTimeLocale }
>("../../../translations/datetime/*.ts")

export const fallbackDateTimeLocale = enGB

export async function loadDateTimeLocale(
    region: Region,
): Promise<DateTimeLocale> {
    if (!supportedRegions.includes(region)) {
        return Promise.resolve(fallbackDateTimeLocale)
    }

    let mod =
        await datetimeLocales[`../../../translations/datetime/${region}.ts`]()
    return mod.default
}

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
