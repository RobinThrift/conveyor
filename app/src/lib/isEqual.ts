import { CalendarDate } from "@internationalized/date"
import { isPlainObject } from "./isPlainObject"
import { isPrimitive } from "./isPrimitive"

export function isEqual(a: any, b: any): boolean {
    let type = getType(a)
    if (type !== getType(b)) {
        return false
    }

    if (type === "primitive") {
        return a === b || (Number.isNaN(a) && Number.isNaN(b))
    }

    if (type === "array") {
        return (
            a.length === b.length &&
            a.every((iterValue: any, i: number) => isEqual(iterValue, b[i]))
        )
    }

    if (type === "map") {
        // keys are not deeply compared, only values
        return (
            a.size === b.size &&
            [...a].every(([iterKey, iterValue]) => {
                return b.has(iterKey) && isEqual(iterValue, b.get(iterKey))
            })
        )
    }

    if (type === "date") {
        return a === b
    }

    if (type === "plainObject") {
        let value1AsMap = new Map(Object.entries(a))
        let value2AsMap = new Map(Object.entries(b))
        return (
            value1AsMap.size === value2AsMap.size &&
            [...value1AsMap].every(([iterKey, iterValue]) => {
                return (
                    value2AsMap.has(iterKey) &&
                    isEqual(iterValue, value2AsMap.get(iterKey))
                )
            })
        )
    }

    if (type === "CalendarDate") {
        return a.compare(b) === 0
    }

    throw new Error("Unreachable")
}

function getType(value: any) {
    if (isPrimitive(value)) return "primitive"
    if (Array.isArray(value)) return "array"
    if (value instanceof Map) return "map"
    if (value instanceof Date) return "date"
    if (isPlainObject(value)) return "plainObject"
    if (value instanceof CalendarDate) return "CalendarDate"
    throw new Error(
        `deeply comparing an instance of type ${value.constructor?.name} is not supported.`,
    )
}
