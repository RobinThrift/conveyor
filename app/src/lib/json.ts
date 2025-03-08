import { fromThrowing, type Result } from "@/lib/result"
import { parseJSON as dateFnsParseJSON } from "date-fns"
import { decodeText } from "./textencoding"

export function parseJSON<R, V = unknown>(
    raw: string | ArrayBufferLike,
    map?: (v: V) => Result<R>,
): Result<R> {
    let str: string
    if (typeof raw === "string") {
        str = raw
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
