import { Temporal } from "temporal-polyfill"

import { type Context, contextFromPlainObject, isContext } from "@/lib/context"

export function prepareForTransfer(value: any): { prepared: any; transferables: Transferable[] } {
    if (value instanceof SharedArrayBuffer) {
        return { prepared: [value], transferables: [] }
    }

    if (isContext(value)) {
        return { prepared: (value as Context).toPlainObject(), transferables: [] }
    }

    if (isTemporalObject(value)) {
        return { prepared: prepareTemporalObject(value), transferables: [] }
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

    if (typeof value === "object" && Object.getOwnPropertyNames(value).length) {
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

    if (typeof value === "object" && "__type" in value && "value" in value) {
        return restoreTemporalObject(value) as T
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
    if (value instanceof SharedArrayBuffer) {
        return []
    }

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

    if (["string", "number", "bigint", "boolean", "symbol", "undefined"].includes(typeof value)) {
        return value
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

    if (typeof value === "object" && Object.getOwnPropertyNames(value).length) {
        let clonable: Record<string, unknown> = {}
        for (let prop in value) {
            clonable[prop] = removeNonClonable(value[prop])
        }
        return clonable
    }

    return value.toString()
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

    if (typeof value === "object" && Object.getOwnPropertyNames(value).length) {
        let fixed: Record<string, unknown> = {}
        for (let prop in value) {
            fixed[prop] = removeNonTransferable(value[prop])
        }
        return fixed
    }

    return value
}

type transferrableTemporalObject = {
    __type: "Temporal.PlainDate" | "Temporal.PlainDateTime" | "Temporal.ZonedDateTime"
    value: string
}

function prepareTemporalObject(
    d: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
): transferrableTemporalObject {
    let value = d.toJSON()

    if (d instanceof Temporal.PlainDate) {
        return { __type: "Temporal.PlainDate", value }
    }

    if (d instanceof Temporal.PlainDateTime) {
        return { __type: "Temporal.PlainDateTime", value }
    }

    return { __type: "Temporal.ZonedDateTime", value }
}

function restoreTemporalObject(
    d: transferrableTemporalObject,
): Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime {
    switch (d.__type) {
        case "Temporal.PlainDate":
            return Temporal.PlainDate.from(d.value)
        case "Temporal.PlainDateTime":
            return Temporal.PlainDateTime.from(d.value)
        case "Temporal.ZonedDateTime":
            return Temporal.ZonedDateTime.from(d.value)
    }
}

function isTemporalObject(
    d: any,
): d is Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime {
    return (
        d instanceof Temporal.PlainDate ||
        d instanceof Temporal.PlainDateTime ||
        d instanceof Temporal.ZonedDateTime
    )
}
