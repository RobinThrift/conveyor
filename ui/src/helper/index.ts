const isPrimitive = (value: any) => value !== Object(value)

const isPlainObject = (value: any) =>
    value != null &&
    [null, Object.prototype].includes(Object.getPrototypeOf(value))

export function isEqual(a: any, b: any): boolean {
    // Each type corresponds to a particular comparison algorithm
    let getType = (value: any) => {
        if (isPrimitive(value)) return "primitive"
        if (Array.isArray(value)) return "array"
        if (value instanceof Map) return "map"
        if (value instanceof Date) return "date"
        if (isPlainObject(value)) return "plainObject"
        throw new Error(
            `deeply comparing an instance of type ${a.constructor?.name} is not supported.`,
        )
    }

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
        // In this particular implementation, map keys are not
        // being deeply compared, only map values.
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

    throw new Error("Unreachable")
}
