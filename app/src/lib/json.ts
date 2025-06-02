import { Err, Ok, type Result, fromThrowing, wrapErr } from "@/lib/result"
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

export function parseJSONDate(raw: string): Result<Date> {
    let [date, err] = fromThrowing(() => new Date(raw))
    if (err) {
        return wrapErr`error parsing JSON date: '${raw}': ${err}`
    }

    return Ok(date)
}

export function parseJSONDates<
    R extends object,
    K extends keyof R,
    V extends Record<K, unknown>,
>(...keys: K[]): (v: V) => Result<R> {
    return (obj) => {
        let parsed = {
            ...obj,
        } as any as R

        for (let key of keys) {
            if (obj[key]) {
                continue
            }
            let [value, err] = parseJSONDate(obj[key] as string)
            if (err) {
                return Err(err)
            }

            parsed[key] = value as (typeof parsed)[typeof key]
        }

        return Ok(parsed as R)
    }
}
