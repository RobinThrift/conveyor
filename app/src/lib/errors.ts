export type ErrorCode = string & { readonly "": unique symbol }

export interface CheckeableError {
    is(value: any): boolean
}

export interface JSONErrObj {
    name: string
    message: string
    stack?: string
}

export interface FromJSONErrObj<E extends Error> {
    fromJSONErrObj<O extends JSONErrObj>(obj: O): E
    ERR_CODE: ErrorCode
}

export function isErr<E extends CheckeableError>(
    value: any,
    target: E,
): boolean {
    return target.is(value)
}

export function asErr<E extends Error, C extends FromJSONErrObj<E>>(
    value: any,
    target: C,
): E | undefined {
    if (typeof target === "function") {
        if (value instanceof target) {
            return value
        }
    }

    if (
        typeof value === "object" &&
        "message" in value &&
        value.message.includes(`[${target.ERR_CODE}]`)
    ) {
        return target.fromJSONErrObj(value)
    }
}
