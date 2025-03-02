import type { Duration } from "@/lib/duration"

export type CancelFunc = (reason?: Error) => void

export interface Context<D = unknown> {
    signal?: AbortSignal
    data: D
    err: any

    withSignal(signal?: AbortSignal): Context<D>
    withCancel(): [Context<D>, CancelFunc]
    withTimeout(timeout: Duration): [Context<D>, CancelFunc]
    withData<K extends string, V>(key: K, value: V): Context<D & Record<K, V>>
    isCancelled(): boolean
}

export const BaseContext: Context = {
    signal: undefined,
    data: undefined,
    err: undefined,

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

    isCancelled() {
        return false
    },
}

class context<D = unknown> {
    public signal?: AbortSignal
    public data: D
    public err: any
    private _isCancelled = false
    private _parent: Context

    constructor(
        parent: Context,
        { signal, data }: { signal?: AbortSignal; data?: D },
    ) {
        this.signal = signal
        this.data = data as D
        this._parent = parent

        let onabort = () => {
            this._isCancelled = true
            this.err = this.signal?.reason
            this.signal?.removeEventListener("abort", onabort)
        }
        this.signal?.addEventListener("abort", onabort)
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
            data: this.data,
            signal: AbortSignal.any(signals),
        })
    }

    withCancel(): [Context<D>, CancelFunc] {
        let abortCntrl = new AbortController()

        return [
            this.withSignal(abortCntrl.signal),
            (reason?: Error) => {
                abortCntrl.abort(reason)
            },
        ]
    }

    withTimeout(timeout: Duration): [Context<D>, CancelFunc] {
        let abortCntrl = new AbortController()

        return [
            this.withSignal(
                AbortSignal.any([
                    abortCntrl.signal,
                    AbortSignal.timeout(timeout),
                ]),
            ),
            (reason?: Error) => {
                abortCntrl.abort(reason)
            },
        ]
    }

    withData<K extends string, V>(key: K, value: V): Context<D & Record<K, V>> {
        return new context<D & Record<K, V>>(this, {
            data: {
                ...this.data,
                [key]: value,
            } as D & Record<K, V>,
            signal: this.signal,
        })
    }

    isCancelled(): boolean {
        if (this._isCancelled || this.signal?.aborted) {
            return true
        }

        return this._parent?.isCancelled() ?? false
    }
}
