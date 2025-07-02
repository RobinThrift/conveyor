import { newID } from "@/domain/ID"
import { BaseContext, type Context, isContext } from "@/lib/context"
import { type AsyncResult, type Result, fromThrowing } from "@/lib/result"
import { getThreadName } from "./thread"

declare const __ENABLE_DEVTOOLS__: boolean

export type Span = {
    id: string

    parentSpan?: string
    name: string
    thread: string
    startTime: number
    endTime?: number

    events: SpanEvent[]
    attrs: Record<string, any>

    recordEvent(type: string, data: any): void
    recordError(err: Error): void
    end(): void
}

export type SpanEvent<D = any> = {
    timestamp: number
    type: string
    data: D
}

export function trace<Return extends Result<any> | AsyncResult<any>>(
    ctx: Context,
    name: string,
    fn: (ctx: Context) => Return,
    attrs?: Record<string, any>,
): Return {
    if (!__ENABLE_DEVTOOLS__) {
        return fn(ctx)
    }

    let [ctxWithSpan, span] = startSpan(ctx, name)
    if (attrs) {
        span.attrs = { ...span.attrs, ...attrs }
    }

    let result = fn(ctxWithSpan)
    if (typeof result === "object" && "then" in result) {
        return result.then((result) => {
            if (Array.isArray(result) && result[1]) {
                span.recordError(result[1])
            }
            span.end()
            return result
        }) as Return
    }

    if (Array.isArray(result) && result[1]) {
        span.recordError(result[1])
    }
    span.end()
    return result
}

export function startSpan<Ctx extends Context>(
    ctx: Ctx,
    name: string,
    attrs: Record<string, any> = {},
): [Ctx, Span] {
    if (!__ENABLE_DEVTOOLS__) {
        return [ctx, noopSpan]
    }

    let parentSpan: Span | undefined = ctx.getData<"span">("span")

    let mark = performance.mark(`trace:${name}:start`)

    let span: Span = {
        id: newID(),
        parentSpan: parentSpan?.id,
        name,
        thread: getThreadName(),
        startTime: mark.startTime.valueOf(),
        events: [],
        attrs,

        recordEvent(type: string, data: any) {
            this.events.push({
                type,
                data,
                timestamp: performance.now().valueOf(),
            })
        },

        recordError(err: Error) {
            this.events.push({
                type: "error",
                timestamp: performance.now().valueOf(),
                data: err,
            })
        },

        end() {
            let mark = performance.mark(`trace:${name}:end`, {
                detail: removeMethods(this),
            })
            this.endTime = mark.startTime.valueOf()
        },
    }

    return [ctx.withData("span", span) as unknown as Ctx, span]
}

type PlainSpan = {
    id: string
    parentSpan?: string
    name: string
    startTime: number
    endTime?: number
    events: SpanEvent[]
    attrs: Record<string, any>
}

function removeMethods(span: Span): PlainSpan {
    return {
        id: span.id,
        parentSpan: span.parentSpan,
        name: span.name,
        startTime: span.startTime,
        endTime: span.endTime,
        events: span.events,
        attrs: span.attrs,
    }
}

export function createTracedProxy<T extends object>(target: T): T {
    if (!__ENABLE_DEVTOOLS__) {
        return target
    }

    return new Proxy(target, {
        get(target, prop) {
            let value = target[prop as keyof T]
            if (typeof value !== "function") {
                return value
            }

            if (typeof prop === "string" && prop.startsWith("_")) {
                return value
            }

            if (prop === "addEventListener") {
                return new Proxy(value, {
                    apply(self, thisArg, argumentsList: [string, (...args: any[]) => void]) {
                        return self.apply(thisArg, [
                            argumentsList[0],
                            (...args: any) => {
                                return trace(
                                    BaseContext,
                                    `${target.constructor.name}/${argumentsList[0]}`,
                                    () =>
                                        fromThrowing(() => argumentsList[1].call(thisArg, ...args)),
                                    { event: argumentsList[0], args },
                                )
                            },
                        ])
                    },
                })
            }

            return new Proxy(value, {
                apply(self, thisArg, argumentsList) {
                    let [ctx, ...args] = argumentsList

                    if (!isContext(ctx)) {
                        return trace(
                            BaseContext,
                            `${target.constructor.name}/${self.name}`,
                            () => self.apply(thisArg, argumentsList),
                            { args: removeNonClonable(argumentsList) },
                        )
                    }

                    return trace(
                        ctx,
                        `${target.constructor.name}/${self.name}`,
                        (ctx) => self.call(thisArg, ctx, ...args),
                        { args: removeNonClonable(argumentsList) },
                    )
                },
            })
        },
    })
}

function removeNonClonable(v: any): any {
    return JSON.parse(
        JSON.stringify(v, (_, value) => {
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

            return value
        }),
    )
}

const noopSpan: Span = {
    id: "noop",
    name: "noop",
    thread: getThreadName(),
    startTime: 0,
    events: [],
    attrs: {},
    recordEvent() {},
    recordError() {},
    end() {},
}
