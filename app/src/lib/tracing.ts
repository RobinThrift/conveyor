import { newID } from "@/domain/ID"
import { BaseContext, type Context, isContext } from "@/lib/context"
import { type AsyncResult, fromThrowing, type Result } from "@/lib/result"
import { getThreadName } from "@/lib/thread"
import { removeNonClonable } from "@/lib/transferable"

const __isSpan = Symbol("__isSpan")

declare const __ENABLE_DEVTOOLS__: boolean

export type Span = {
    [__isSpan]: true

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

const noopSpan: Span = {
    [__isSpan]: true,
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

export function isSpan(v: any): boolean {
    return (v && typeof v === "object" && __isSpan in v) || ("__isSpan" in v && v.__isSpan)
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

    let [ctxWithSpan, span] = startSpan(ctx, `trace:${name}`)
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

    let mark = performance.mark(`${name}:start`)

    let span: Span = {
        [__isSpan]: true,
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
            let mark = performance.mark(`${name}:end`, {
                detail: toPlainSpan(this),
            })
            this.endTime = mark.startTime.valueOf()
        },
    }

    return [ctx.withData("span", span) as unknown as Ctx, span]
}

type PlainSpan = {
    __isSpan: true
    id: string
    parentSpan?: string
    name: string
    thread: string
    startTime: number
    endTime?: number
    events: SpanEvent[]
    attrs: Record<string, any>
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
                                    { event: argumentsList[0], args: removeNonClonable(args) },
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

export function toPlainSpan(span: Span): PlainSpan {
    return {
        __isSpan: true,
        id: span.id,
        parentSpan: span.parentSpan,
        name: span.name,
        thread: span.thread,
        startTime: span.startTime,
        endTime: span.endTime,
        events: span.events,
        attrs: span.attrs,
    }
}

export function spanFromPlainSpan(span: PlainSpan): Span {
    return {
        [__isSpan]: true,
        id: span.id,
        parentSpan: span.parentSpan,
        name: span.name,
        thread: span.thread,
        startTime: span.startTime,
        endTime: span.endTime,
        events: span.events,
        attrs: span.attrs,

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
            let mark = performance.mark(`trace:${span.name}:end`, {
                detail: toPlainSpan(this),
            })
            this.endTime = mark.startTime.valueOf()
        },
    }
}
