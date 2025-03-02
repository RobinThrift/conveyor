import { BaseContext, type Context } from "@/lib/context"
import { randomID } from "@/lib/randomID"
import { type AsyncResult, Err, type Result, fromPromise } from "@/lib/result"

export function isWorkerContext() {
    return (
        typeof WorkerGlobalScope !== "undefined" &&
        globalThis instanceof WorkerGlobalScope
    )
}

export function createWorker<
    Messages extends string,
    Handlers extends Record<
        Messages,
        (ctx: Context, params: any) => AsyncResult<unknown>
    >,
>(
    handlers: Handlers,
): {
    runIfWorker: () => void
    createClient: (
        worker: Worker,
        signal?: AbortSignal,
    ) => Client<Messages, Handlers>
} {
    let createClient = (worker: Worker, signal?: AbortSignal) => {
        let wrapper = new WorkerWrapper(worker, signal)
        let client = {} as WorkerClient<Messages, Handlers>
        for (let msg in handlers) {
            client[msg] = ((ctx, params) => {
                return fromPromise(
                    wrapper.postMessage(ctx, {
                        type: msg,
                        params,
                    }),
                )
            }) as (typeof handlers)[typeof msg]
        }

        return {
            ...client,
            addEventListener: (_, cb, opts) => {
                wrapper.addEventListener(
                    "error",
                    (evt) => {
                        let err = evt.error
                        if (!err) {
                            err = evt.message
                        }

                        cb(
                            new MessageEvent(evt.type, {
                                data: {
                                    id: "ERROR",
                                    type: "error",
                                    error: err || new Error("unknown error"),
                                },
                            }),
                        )
                    },
                    opts,
                )
                wrapper.addEventListener("messageerror", cb, opts)
            },
            terminate: () => wrapper.terminate(),
        } satisfies Client<Messages, Handlers>
    }

    let run = async (
        evt: MessageEvent<{
            id: string
            type: keyof Handlers
            params?: any
        }>,
    ) => {
        let result: Result<any> = Err(
            new Error(`unknown request type ${evt.data.type as string}`),
        )

        let handler = handlers[evt.data.type]
        if (handler) {
            result = await handler(BaseContext, evt.data.params)
        }

        if (!result.ok) {
            postMessage({
                type: "error",
                id: evt.data.id,
                error: result.err,
            } satisfies WorkerErrorResponseMessage)
            return
        }

        postMessage({
            type: "success",
            id: evt.data.id,
            data: result.value,
        } satisfies WorkerSuccessResponseMessage)
    }

    let runIfWorker = () => {
        if (isWorkerContext()) {
            globalThis.onmessage = run
        }
    }

    return {
        createClient,
        runIfWorker,
    }
}

type WorkerClient<
    Messages extends string,
    Handlers extends Record<
        Messages,
        (ctx: Context, params: any) => AsyncResult<unknown>
    >,
> = Handlers

type Client<
    Messages extends string,
    Handlers extends Record<
        Messages,
        (ctx: Context, params: any) => AsyncResult<unknown>
    >,
> = WorkerClient<Messages, Handlers> & {
    addEventListener: (
        event: "error",
        cb: (ev: MessageEvent<WorkerErrorResponseMessage>) => void,
        options?: EventListenerOptions,
    ) => void
    terminate: () => void
}

interface WorkerSuccessResponseMessage<T extends Transferable = any> {
    id: string
    type: "success"
    data: T
}

export interface WorkerErrorResponseMessage {
    id: string
    type: "error"
    error: Error
}

class WorkerWrapper {
    private _worker: Worker
    private _requests = new Map<
        string,
        ReturnType<typeof Promise.withResolvers<any>>
    >()

    constructor(worker: Worker, signal?: AbortSignal) {
        this._worker = worker

        this._worker.addEventListener(
            "message",
            (
                evt: MessageEvent<
                    WorkerSuccessResponseMessage | WorkerErrorResponseMessage
                >,
            ) => {
                switch (evt.data.type) {
                    case "success":
                        this._handleSuccess(evt.data)
                        break
                    case "error":
                        this._handleError(evt.data)
                        break
                    default:
                        throw new Error(
                            `unknown output type ${JSON.stringify(evt.data)}`,
                        )
                }
            },
            { signal },
        )

        signal?.addEventListener(
            "abort",
            () => {
                this._worker.terminate()
            },
            { once: true },
        )
    }

    public addEventListener<T>(
        event: "message",
        cb: (ev: MessageEvent<T>) => any,
        options?: EventListenerOptions,
    ): void
    public addEventListener<T>(
        event: "messageerror",
        cb: (ev: MessageEvent<T>) => any,
        options?: EventListenerOptions,
    ): void
    public addEventListener(
        event: "error",
        cb: (ev: ErrorEvent) => any,
        options?: EventListenerOptions,
    ): void
    public addEventListener<T>(
        event: "error" | "message" | "messageerror",
        cb: ((ev: ErrorEvent) => any) | ((ev: MessageEvent<T>) => any),
        options?: EventListenerOptions,
    ): void {
        switch (event) {
            case "error":
                this._worker.addEventListener(
                    event,
                    cb as (ev: ErrorEvent) => any,
                    options,
                )
                break
            case "message":
                this._worker.addEventListener(
                    event,
                    cb as (ev: MessageEvent<T> | ErrorEvent) => any,
                    options,
                )
                break
            case "messageerror":
                this._worker.addEventListener(
                    event,
                    cb as (ev: MessageEvent<T> | ErrorEvent) => any,
                    options,
                )
                break
        }
    }

    public terminate() {
        this._worker.terminate()
    }

    private _handleSuccess(res: WorkerSuccessResponseMessage) {
        let request = this._requests.get(res.id)
        if (!request) {
            return
        }

        request.resolve(res.data)
        this._requests.delete(res.id)
    }

    private _handleError(res: WorkerErrorResponseMessage) {
        let request = this._requests.get(res.id)
        if (!request) {
            return
        }

        request.reject(res.error)
        this._requests.delete(res.id)
    }

    public async postMessage<R, T extends string, P>(
        ctx: Context,
        msg: {
            type: T
            params: P
        },
    ): Promise<R> {
        let id = randomID()
        let request = Promise.withResolvers<any>()
        this._requests.set(id, request)

        ctx.signal?.addEventListener(
            "abort",
            () => {
                request.reject(ctx.signal?.reason)
            },
            { once: true },
        )

        ctx.signal?.throwIfAborted()
        this._worker.postMessage({
            ...msg,
            id,
        })
        ctx.signal?.throwIfAborted()

        return request.promise
    }
}
