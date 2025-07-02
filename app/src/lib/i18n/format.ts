import {
    type CalendarDate,
    type CalendarDateTime,
    calendarDateFromDate,
    calendarDateTimeFromDate,
    getLocalTimeZone,
    isSameDay,
} from "./datetime"
import type { Region } from "./regions"

const regionFixed: Partial<Record<Region, string>> = {
    gb: "en-gb",
    us: "en-us",
}

export function format(region: Region) {
    let code = regionFixed[region] || region
    return {
        number(num: number, opts?: Intl.NumberFormatOptions) {
            return new Intl.NumberFormat(code, opts).format(num)
        },

        formatDateTime(
            date?: Date | CalendarDate | CalendarDateTime,
            opts?: Intl.DateTimeFormatOptions,
        ) {
            let d: Date | undefined
            if (date instanceof Date) {
                d = date
            } else {
                d = date?.toDate(getLocalTimeZone())
            }
            return new Intl.DateTimeFormat(code, opts).format(d)
        },

        formatRelative: <D extends Date | CalendarDate | CalendarDateTime>(
            laterDate: D,
            earlierDate: D,
            opts?: Intl.DateTimeFormatOptions,
        ): { date: string; time: string } => {
            if (laterDate instanceof Date) {
                return formatDistanceDateTime(
                    calendarDateTimeFromDate(laterDate),
                    calendarDateTimeFromDate(earlierDate as Date),
                    code,
                    opts,
                )
            }

            if ("calendar" in laterDate && "hour" in laterDate) {
                return formatDistanceDateTime(
                    laterDate as CalendarDateTime,
                    earlierDate instanceof Date
                        ? calendarDateTimeFromDate(earlierDate)
                        : (earlierDate as CalendarDateTime),
                    code,
                    opts,
                )
            }

            return formatDistanceDates(
                laterDate instanceof Date
                    ? calendarDateFromDate(laterDate)
                    : (laterDate as CalendarDate),
                earlierDate instanceof Date
                    ? calendarDateFromDate(earlierDate)
                    : (earlierDate as CalendarDate),
                code,
                opts,
            )
        },
    }
}

function formatDistanceDateTime(
    laterDate: CalendarDateTime,
    earlierDate: CalendarDateTime,
    code: string,
    opts?: Intl.DateTimeFormatOptions,
): { date: string; time: string } {
    let date = earlierDate.toDate(getLocalTimeZone())

    let diffDays =
        laterDate.calendar.toJulianDay(laterDate) - earlierDate.calendar.toJulianDay(earlierDate)

    let formatted: string
    if (diffDays === 0) {
        let diffSeconds = diffCalendarDateTime(laterDate, earlierDate)

        if (diffSeconds < 60) {
            formatted = new Intl.RelativeTimeFormat(code, {
                style: "long",
                numeric: "auto",
            }).format(-diffSeconds, "second")
        } else if (diffSeconds < 3600) {
            formatted = new Intl.RelativeTimeFormat(code, {
                style: "long",
                numeric: "auto",
            }).format(Math.round(-diffSeconds / 60), "minute")
        } else {
            formatted = new Intl.RelativeTimeFormat(code, {
                style: "long",
                numeric: "auto",
            }).format(Math.round(-diffSeconds / 3600), "hour")
        }
    } else if (Math.abs(diffDays) <= 3) {
        formatted = new Intl.RelativeTimeFormat(code, {
            style: "long",
            numeric: "auto",
        }).format(-diffDays, "day")
    } else {
        formatted = new Intl.DateTimeFormat(code, {
            dateStyle: "long",
            ...opts,
            timeStyle: undefined,
        }).format(date)
    }

    return {
        date: formatted,
        time: new Intl.DateTimeFormat(code, {
            timeStyle: "short",
            ...opts,
            dateStyle: undefined,
        }).format(date),
    }
}

function formatDistanceDates(
    laterDate: CalendarDate,
    earlierDate: CalendarDate,
    code: string,
    opts?: Intl.DateTimeFormatOptions,
): { date: string; time: string } {
    let date = laterDate?.toDate(getLocalTimeZone())
    if (isSameDay(laterDate, earlierDate)) {
        return {
            date: new Intl.DateTimeFormat(code, {
                dateStyle: "short",
                ...opts,
                timeStyle: undefined,
            }).format(date),
            time: new Intl.DateTimeFormat(code, {
                timeStyle: "short",
                ...opts,
                dateStyle: undefined,
            }).format(date),
        }
    }

    return {
        date: new Intl.RelativeTimeFormat(code, {
            style: "long",
        }).format(
            laterDate.calendar.toJulianDay(laterDate) -
                earlierDate.calendar.toJulianDay(earlierDate),
            "days",
        ),
        time: new Intl.DateTimeFormat(code, {
            ...opts,
            timeStyle: "short",
        }).format(date),
    }
}

// calulates the diff in seconds
function diffCalendarDateTime(laterDate: CalendarDateTime, earlierDate: CalendarDateTime): number {
    let tz = getLocalTimeZone()
    return Math.floor((laterDate.toDate(tz).getTime() - earlierDate.toDate(tz).getTime()) / 1000)
}
