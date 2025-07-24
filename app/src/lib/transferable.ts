import { CalendarDate } from "@internationalized/date"

import { type Context, contextFromPlainObject, isContext } from "@/lib/context"

export function prepareForTransfer(value: any): { prepared: any; transferables: Transferable[] } {
    if (isContext(value)) {
        return { prepared: (value as Context).toPlainObject(), transferables: [] }
    }

    if (Array.isArray(value)) {
        return value.reduce(
            (prev, v) => {
                let prepared = prepareForTransfer(v)
                prev.transferables.push(...prepared.transferables)
                prev.prepared.push(prepared.prepared)
                return prev
            },
            { prepared: [], transferables: [] },
        )
    }

    if (typeof value === "object" && Object.getOwnPropertyDescriptors(value).length) {
        let prepared: Record<string, unknown> = {}
        let transferables: Transferable[] = []
        for (let prop in value) {
            let p = prepareForTransfer(value[prop])
            prepared[prop] = p.prepared
            transferables.push(...p.transferables)
        }

        return { prepared, transferables }
    }

    return { prepared: removeNonTransferable(value), transferables: getTransferables(value) }
}

export function restoreTransferredValue<T>(value: any): T {
    if (isContext(value)) {
        return contextFromPlainObject(value) as T
    }

    if (Array.isArray(value)) {
        return value.map((v) => restoreTransferredValue(v)) as T
    }

    if (
        value instanceof Date ||
        value instanceof Uint8Array ||
        value instanceof ArrayBuffer ||
        value instanceof Error
    ) {
        return value as T
    }

    if (
        typeof value === "object" &&
        "calendar" in value &&
        typeof value.calendar === "object" &&
        value.calendar.identifier
    ) {
        return new CalendarDate(value.year, value.month, value.day) as T
    }

    if (typeof value === "object") {
        let restored: Record<string, unknown> = {}
        for (let prop in value) {
            restored[prop] = restoreTransferredValue(value[prop])
        }

        return restored as T
    }

    return value
}

export function getTransferables(value: any): Transferable[] {
    if (value instanceof ArrayBuffer) {
        return [value]
    }

    if (value instanceof Uint8Array) {
        return [value.buffer]
    }

    if (Array.isArray(value)) {
        return Array.from(
            value.values().flatMap((v) => {
                return getTransferables(v)
            }),
        )
    }

    if (typeof value === "object") {
        let transferables: Transferable[] = []
        for (let prop in value) {
            transferables.push(...getTransferables(value[prop]))
        }

        return transferables
    }

    return []
}

export function removeNonClonable(value: any): any {
    if (!value) {
        return
    }

    if (value instanceof Error) {
        return value
    }

    if (value instanceof AbortSignal) {
        return undefined
    }

    if (value instanceof ArrayBuffer) {
        return "[ArrayBuffer]"
    }

    if (value instanceof Uint8Array) {
        return "[Uint8Array]"
    }

    if (typeof value === "function") {
        return `[Function ${value.name || "anonymous"}]`
    }

    if (isContext(value)) {
        return "[Context]"
    }

    if (Array.isArray(value)) {
        return value.map((v) => removeNonClonable(v))
    }

    if (typeof value === "object") {
        let clonable: Record<string, unknown> = {}
        for (let prop in value) {
            clonable[prop] = removeNonClonable(value[prop])
        }
        return clonable
    }

    return value
}

export function removeNonTransferable(value: any): any {
    if (!value) {
        return value
    }

    if (value instanceof Error) {
        return value
    }

    if (value instanceof AbortSignal) {
        return undefined
    }

    if (typeof value === "function") {
        return `[Function ${value.name || "anonymous"}]`
    }

    if (Array.isArray(value)) {
        return value.map((v) => removeNonTransferable(v))
    }

    if (value instanceof Date) {
        return value
    }

    if (typeof value === "object" && Object.getOwnPropertyDescriptors(value).length) {
        let fixed: Record<string, unknown> = {}
        for (let prop in value) {
            fixed[prop] = removeNonTransferable(value[prop])
        }
        return fixed
    }

    return value
}
