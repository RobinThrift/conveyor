import { parseJSON as dateFnsParseJSON } from "date-fns"

import { Ok, type Result, fromThrowing } from "@/lib/result"
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

    let parsed = fromThrowing(() => JSON.parse(str))
    if (typeof map === "function" && parsed.ok) {
        return map(parsed.value)
    }
    return parsed
}

export function parseJSONDate(raw: string): Result<Date> {
    return fromThrowing(() => dateFnsParseJSON(raw))
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
            let d = parseJSONDate(obj[key] as string)
            if (!d.ok) {
                return d
            }

            parsed[key] = d.value as (typeof parsed)[typeof key]
        }

        return Ok(parsed as R)
    }
}
