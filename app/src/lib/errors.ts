export type ErrorCode = string & { readonly "": unique symbol }

export function isErr<ToCheck extends Error, Target extends { new (...a: any[]): Error }>(
    value: ToCheck | null | undefined,
    target: Target | string,
): boolean {
    if (!value) {
        return false
    }

    if (value instanceof AggregateError) {
        return value.errors.some((err) => isErr(err, target))
    }

    if (typeof target === "string") {
        return value.name === target || (value.cause as Error)?.name === target
    }

    if (
        "__proto__" in value &&
        typeof value.__proto__ === "function" &&
        value.__proto__ === target
    ) {
        return true
    }

    let valueCode =
        (CustomErrCode in value && (value[CustomErrCode] as string)) ||
        ("__proto__" in value &&
            typeof value.__proto__ === "function" &&
            value.__proto__ &&
            CustomErrCode in value.__proto__ &&
            (value.__proto__[CustomErrCode] as string))

    let targetCode = CustomErrCode in target && (target[CustomErrCode] as string)

    if (!targetCode) {
        return value instanceof target
    }

    if (valueCode === targetCode) {
        return true
    }

    if (value.message.includes(targetCode)) {
        return true
    }

    return false
}

export const CustomErrCode = Symbol("CustomErrType")

export function createErrType(type: string, msg: string) {
    return class extends Error {
        public static [CustomErrCode] = type as ErrorCode

        constructor(options?: ErrorOptions & { stack?: string }) {
            super(`[${type}]: ${msg}`, options)
            this.stack = options?.stack
        }
    }
}

export function isCustomErrType(e: Error): boolean {
    if (CustomErrCode in e) {
        return true
    }

    if (
        "__proto__" in e &&
        typeof e.__proto__ === "function" &&
        e.__proto__ &&
        CustomErrCode in e.__proto__
    ) {
        return true
    }

    return false
}
