import { Temporal } from "temporal-polyfill"

import { calendarDateTimeFromDate } from "@/lib/i18n"
import { fromThrowing, Ok, type Result, wrapErr } from "@/lib/result"
import { decodeText } from "@/lib/textencoding"

export function jsonDeserialize<R, V = unknown>(
    raw: string | ArrayBufferLike | Uint8Array<ArrayBufferLike>,
    map?: (v: V) => Result<R>,
): Result<R> {
    let str: string
    if (typeof raw === "string") {
        str = raw
    } else if (raw instanceof Uint8Array) {
        str = decodeText(raw)
    } else {
        str = decodeText(new Uint8Array(raw))
    }

    let [parsed, err] = fromThrowing(() => JSON.parse(str))
    if (typeof map === "function" && !err) {
        return map(parsed)
    }

    return Ok(parsed)
}

export function parseJSONDate(raw: string): Result<Temporal.ZonedDateTime> {
    let [date, err] = fromThrowing(() => Temporal.ZonedDateTime.from(raw))
    if (!err) {
        return Ok(date)
    }

    let [rfc3339Date, rfc3339err] = fromThrowing(() => new Date(raw))
    if (rfc3339err) {
        return wrapErr`error parsing JSON date: '${raw}': ${err}`
    }

    return Ok(calendarDateTimeFromDate(rfc3339Date) as Temporal.ZonedDateTime)
}
