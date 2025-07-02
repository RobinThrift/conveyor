import type { Duration } from "@/lib/duration"

const __isContext = Symbol("__isContext")

export function isContext(v: any): boolean {
    return v && typeof v === "object" && __isContext in v
}

export type CancelFunc = (reason?: Error) => void

export interface Context<D extends Record<string, unknown> = Record<string, any>> {
    signal?: AbortSignal

    withSignal(signal?: AbortSignal): Context<D>
    withCancel(): [Context<D>, CancelFunc]
    withTimeout(timeout: Duration): [Context<D>, CancelFunc]
    withData<K extends string, V>(key: K, value: V): Context<D & Record<K, V>>
    isCancelled(): boolean
    err(): Error | undefined

    getData<K extends keyof D>(key: K): D[K]
    getData<K extends keyof D>(key: K, fallback: D[K]): Required<D>[K]
}

export const BaseContext: Context = {
    signal: undefined,

    withSignal(signal?: AbortSignal) {
        return new context(BaseContext, { signal })
    },

    withCancel() {
        return new context(BaseContext, {}).withCancel()
    },

    withTimeout(timeout: Duration) {
        return new context(BaseContext, {}).withTimeout(timeout)
    },

    withData<K extends string, V>(key: K, value: V): Context<Record<K, V>> {
        return new context(BaseContext, {}).withData(key, value)
    },

    getData(_, fallback: any = undefined) {
        return fallback
    },

    isCancelled() {
        return false
    },

    err(): Error | undefined {
        return undefined
    },

    //@ts-expect-error
    [__isContext]: true,
}

class context<D extends Record<string, unknown> = Record<string, any>> {
    public signal?: AbortSignal
    private _err?: Error
    private _data: D
    private _isCancelled = false
    private _parent: Context;

    [__isContext] = true

    constructor(parent: Context, { signal, data }: { signal?: AbortSignal; data?: D }) {
        this.signal = signal
        this._data = (data ?? {}) as D
        this._parent = parent

        this.signal?.addEventListener(
            "abort",
            () => {
                this._isCancelled = true
                this._err = this.signal?.reason
            },
            { once: true },
        )
    }

    withSignal(signal?: AbortSignal): Context<D> {
        let signals: AbortSignal[] = []
        if (this.signal) {
            signals.push(this.signal)
        }

        if (signal) {
            signals.push(signal)
        }

        return new context<D>(this, {
            data: this._data,
            signal: AbortSignal.any(signals),
        })
    }

    withCancel(): [Context<D>, CancelFunc] {
        let abortCntrl = new AbortController()

        return [
            this.withSignal(abortCntrl.signal),
            (reason: Error = new Error("context was cancelled")) => {
                abortCntrl.abort(reason)
            },
        ]
    }

    withTimeout(timeout: Duration): [Context<D>, CancelFunc] {
        let abortCntrl = new AbortController()

        return [
            this.withSignal(AbortSignal.any([abortCntrl.signal, AbortSignal.timeout(timeout)])),
            (reason: Error = new Error("context was cancelled")) => {
                abortCntrl.abort(reason)
            },
        ]
    }

    withData<K extends string, V>(key: K, value: V): Context<D & Record<K, V>> {
        return new context<D & Record<K, V>>(this, {
            data: {
                ...this._data,
                [key]: value,
            } as D & Record<K, V>,
            signal: this.signal,
        })
    }

    getData<K extends keyof D>(key: K): D[K]
    getData<K extends keyof D>(key: K, fallback: D[K]): Required<D>[K]
    getData<K extends keyof D>(key: K, fallback?: D[K]): D[K] | Required<D>[K] {
        if (fallback) {
            return (this._data[key] || fallback) as Required<D>[K]
        }

        return this._data[key]
    }

    isCancelled(): boolean {
        if (this._isCancelled || this.signal?.aborted) {
            return true
        }

        return this._parent?.isCancelled() ?? false
    }

    err(): Error | undefined {
        if (this._err) {
            return this._err
        }

        if (this.signal?.aborted) {
            return this.signal.reason
        }

        if (this._isCancelled) {
            return new Error("context cancelled for unknown reason")
        }
    }
}
