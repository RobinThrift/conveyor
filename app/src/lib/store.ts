import {
    batch as baseBatch,
    Derived,
    type DerivedOptions,
    Effect,
    Store,
    type StoreOptions,
} from "@tanstack/react-store"

import { BaseContext, type Context } from "@/lib/context"
import { startSpan } from "@/lib/tracing"
import { removeNonClonable } from "@/lib/transferable"

declare const __ENABLE_DEVTOOLS__: boolean

export type AnyUpdater = (prev: any) => any

let __tracedStores = __ENABLE_DEVTOOLS__ ? new Map<string, Store<any, any>>() : (undefined as never)
let __lastHandledBatch = -1
export const createStore = <TState, TUpdater extends AnyUpdater = (cb: TState) => TState>(
    name: string,
    initialState: TState,
    options?: StoreOptions<TState, TUpdater>,
) => {
    let store = new Store(initialState, options)
    if (__ENABLE_DEVTOOLS__) {
        __tracedStores.set(name, store)

        performance.mark("stores:init", { detail: { name, currValue: store.state } })

        store.subscribe(() => {
            if (typeof __currentAction !== "undefined") {
                return
            }

            if (__currentBatch === __lastHandledBatch) {
                return
            }
            __lastHandledBatch = __currentBatch

            let trace: { stack: typeof Error.prototype.stack } = { stack: "" }
            Error.captureStackTrace(trace)
            performance.mark("stores:update", {
                detail: {
                    name,
                    currValues: __getCurrentTracedStoresStates(),
                    prevValues: __getPrevTracedStoresStates(),
                    triggeredByAction: __currentAction,
                    trace: trace.stack,
                },
            })
        })
    }

    return store
}

export function createDerived<T>(
    name: string,
    opts: DerivedOptions<T> & { autoMount: true },
): [Derived<T>, () => void]
export function createDerived<T>(name: string, opts: DerivedOptions<T>): [Derived<T>, undefined]
export function createDerived<T>(
    name: string,
    opts: DerivedOptions<T> & { autoMount?: true },
): [Derived<T>, (() => void) | undefined] {
    let baseOpts = {
        ...opts,
    }

    if (__ENABLE_DEVTOOLS__) {
        baseOpts.fn = (props) => {
            let trace: { stack: typeof Error.prototype.stack } = { stack: "" }
            Error.captureStackTrace(trace)
            performance.mark("stores:update", {
                detail: {
                    name,
                    currValues: __getCurrentTracedStoresStates(),
                    prevValues: __getPrevTracedStoresStates(),
                    triggeredByAction: __currentAction,
                    trace: trace.stack,
                },
            })
            return opts.fn(props)
        }
    }

    let derived = new Derived(baseOpts)

    if (__ENABLE_DEVTOOLS__) {
        __tracedStores.set(name, derived as any)
    }

    if (opts.autoMount) {
        return [derived, derived.mount()]
    }

    return [derived, undefined]
}

let __currentBatch = 0
export let batch = baseBatch
if (__ENABLE_DEVTOOLS__) {
    batch = (fn: () => void) => {
        __currentBatch++
        return fn()
    }
}

interface EffectOptions
    extends Omit<DerivedOptions<unknown>, "onUpdate" | "onSubscribe" | "lazy" | "fn"> {
    eager?: boolean
    precondition?: () => boolean
    fn:
        | ((ctx: Context, effect: { batch: typeof batch }) => Promise<void>)
        | ((ctx: Context, effect: { batch: typeof batch }) => void)
    autoMount?: boolean
}

let __currentEffect: string | undefined

export function createEffect(
    name: string,
    opts: EffectOptions & { autoMount: true },
): [Effect, () => void]
export function createEffect(name: string, opts: EffectOptions): [Effect, undefined]
export function createEffect(
    name: string,
    opts: EffectOptions,
): [Effect, (() => void) | undefined] {
    let baseOpts = {
        ...opts,
        fn: async () => {
            if (opts.precondition?.() ?? true) {
                return opts.fn(BaseContext, { batch })
            }
        },
    }

    if (__ENABLE_DEVTOOLS__) {
        baseOpts.fn = async () => {
            if (!(opts.precondition?.() ?? true)) {
                return
            }

            let trace: { stack: typeof Error.prototype.stack } = { stack: "" }
            Error.captureStackTrace(trace)

            let err: Error | undefined
            let [ctxWithSpan, span] = startSpan(BaseContext, `trace:effects:${name}`, {
                originalState: __getCurrentTracedStoresStates(),
                trace: trace.stack,
                deps: opts.deps.map((store) => __getStoreName(store)),
            })
            try {
                await opts.fn(ctxWithSpan, {
                    batch: (fn) => {
                        let prevEffect = __currentEffect
                        __currentEffect = name
                        fn()
                        __currentEffect = prevEffect
                    },
                })
            } catch (e) {
                span.recordError(e as Error)
                err = e as Error
            } finally {
                span.attrs.finalState = __getCurrentTracedStoresStates()
                span.end()
            }

            if (err) {
                throw new Error(name, { cause: err })
            }
        }
    }

    let effect = new Effect(baseOpts)

    if (opts.autoMount) {
        return [effect, effect.mount()]
    }

    return [effect, undefined]
}

export let createActions = <A>(a: A): A => a
if (__ENABLE_DEVTOOLS__) {
    createActions = traceActions as typeof createActions
}

let __currentAction: string | undefined
function traceActions<Actions extends Record<string, CallableFunction>>(actions: Actions) {
    if (__ENABLE_DEVTOOLS__) {
        let traced: Actions = {} as Actions

        for (let name in actions) {
            traced[name] = ((...args: any[]) => {
                let prevAction = __currentAction
                __currentAction = name

                let trace: { stack: typeof Error.prototype.stack } = { stack: "" }
                Error.captureStackTrace(trace)

                let [, span] = startSpan(BaseContext, `trace:actions:${name}`, {
                    trace: trace.stack,
                    args: args,
                    originalState: __getCurrentTracedStoresStates(),
                    effect: __currentEffect,
                })

                let r: any
                let err: any
                try {
                    r = actions[name](...args)
                } catch (e) {
                    span.recordError(e as Error)
                    err = e
                } finally {
                    span.attrs.finalState = __getCurrentTracedStoresStates()
                    span.end()
                    __currentAction = prevAction
                }

                if (err) {
                    throw err
                }

                return r
            }) as any
        }

        return traced
    }

    return actions
}

function __getCurrentTracedStoresStates() {
    return Object.fromEntries(
        __tracedStores.entries().map(([name, store]) => [name, removeNonClonable(store.state)]),
    )
}

function __getPrevTracedStoresStates() {
    return Object.fromEntries(
        __tracedStores.entries().map(([name, store]) => [name, removeNonClonable(store.prevState)]),
    )
}

function __getStoreName(s: Store<any>) {
    return __tracedStores.entries().find(([_, store]) => store === s)?.[0]
}
