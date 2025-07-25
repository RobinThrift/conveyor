import { nanoid } from "nanoid"

import { APITokenController } from "@/control/APITokenController"
import { AttachmentController } from "@/control/AttachmentController"
import { AuthController } from "@/control/AuthController"
import { ChangelogController } from "@/control/ChangelogController"
import { CryptoController } from "@/control/CryptoController"
import { JobController } from "@/control/JobController"
import { MemoController } from "@/control/MemoController"
import { SettingsController } from "@/control/SettingsController"
import { SetupController } from "@/control/SetupController"
import { SyncController } from "@/control/SyncController"
import { UnlockController } from "@/control/UnlockController"
import type { Context } from "@/lib/context"
import { queueTask } from "@/lib/microtask"
import { type AsyncResult, Err, Ok } from "@/lib/result"
import { prepareForTransfer, restoreTransferredValue } from "@/lib/transferable"

import type { API, ClientNotifications, Notifications } from "./api"
import type {
    Events,
    WorkerNotificationMessage,
    WorkerRequestMessage,
    WorkerResponseMessage,
} from "./types"

export class BackendClient {
    private _worker: Worker
    private _requests = new Map<string, ReturnType<typeof Promise.withResolvers<any>>>()

    public apiTokens: Client<API["APITokenController"]>
    public attachments: Client<API["AttachmentController"]>
    public auth: Client<API["AuthController"]>
    public changelog: Client<API["ChangelogController"]>
    public crypto: Client<API["CryptoController"]>
    public jobs: Client<API["JobController"]>
    public memos: Client<API["MemoController"]>
    public settings: Client<API["SettingsController"]>
    public setup: Client<API["SetupController"]>
    public sync: Client<API["SyncController"]>
    public unlock: Client<API["UnlockController"]>

    private _events: Events<Notifications> = {}

    constructor() {
        this._worker = new Worker(new URL("./backend.worker?worker&url", import.meta.url), {
            type: "module",
            name: `Backend-${nanoid()}`,
        })

        let workerRef = new WeakRef(this._worker)

        this.apiTokens = createClient({
            name: "APITokenController",
            target: APITokenController.prototype,
            requests: this._requests,
            worker: workerRef,
        })

        this.attachments = createClient({
            name: "AttachmentController",
            target: AttachmentController.prototype,
            requests: this._requests,
            worker: workerRef,
        })

        this.auth = createClient({
            name: "AuthController",
            target: AuthController.prototype,
            requests: this._requests,
            worker: workerRef,
        })

        this.changelog = createClient({
            name: "ChangelogController",
            target: ChangelogController.prototype,
            requests: this._requests,
            worker: workerRef,
        })

        this.crypto = createClient({
            name: "CryptoController",
            target: CryptoController.prototype,
            requests: this._requests,
            worker: workerRef,
        })

        this.jobs = createClient({
            name: "JobController",
            target: JobController.prototype,
            requests: this._requests,
            worker: workerRef,
        })

        this.memos = createClient({
            name: "MemoController",
            target: MemoController.prototype,
            requests: this._requests,
            worker: workerRef,
        })

        this.settings = createClient({
            name: "SettingsController",
            target: SettingsController.prototype,
            requests: this._requests,
            worker: workerRef,
        })

        this.setup = createClient({
            name: "SetupController",
            target: SetupController.prototype,
            requests: this._requests,
            worker: workerRef,
        })

        this.sync = createClient({
            name: "SyncController",
            target: SyncController.prototype,
            requests: this._requests,
            worker: workerRef,
        })

        this.unlock = createClient({
            name: "UnlockController",
            target: UnlockController.prototype,
            requests: this._requests,
            worker: workerRef,
        })

        this._worker.addEventListener("message", this._onMessage.bind(this))

        this._worker.addEventListener("error", (evt) => {
            console.error("error in backend worker:", evt)
        })

        this._worker.addEventListener("messageerror", (evt) => {
            console.error("error in backend worker: error decoding message: ", evt)
        })

        listenForPerformanceEntries(this._worker)

        this._listenForVisibiltyChangeEvent()
    }

    public terminate() {
        this._worker.terminate()
    }

    public addEventListener<K extends keyof Notifications>(
        event: K,
        cb: (data: Notifications[K]) => void,
    ): () => void {
        if (!this._events[event]) {
            this._events[event] = []
        }
        this._events[event].push(cb)
        return () => {
            if (!this._events[event]) {
                return
            }
            this._events[event] = this._events[event].filter((i) => cb !== i) as any
        }
    }

    public sendNotification<K extends keyof ClientNotifications>(
        event: K,
        data: ClientNotifications[K],
    ) {
        let { prepared, transferables } = prepareForTransfer(data)
        let id = nanoid()

        try {
            this._worker.postMessage(
                {
                    type: "notification",
                    id,
                    action: event,
                    data: prepared,
                } satisfies WorkerNotificationMessage,
                transferables,
            )
        } catch (e) {
            console.error("error sending notification", e)
        }
    }

    private _onMessage(
        evt: MessageEvent<WorkerResponseMessage | WorkerNotificationMessage<keyof Notifications>>,
    ) {
        let msg = evt.data
        switch (msg?.type) {
            case "notification":
                evt.stopImmediatePropagation()
                this._handleNofitication(msg)
                break
            case "response":
                evt.stopImmediatePropagation()
                this._handleResponse(msg)
                break
            default:
                return
        }
    }

    private _handleResponse(msg: WorkerResponseMessage) {
        console.debug("[UI]: received response", msg)
        let request = this._requests.get(`${msg.action}/${msg.id}`)
        if (!request) {
            return
        }
        this._requests.delete(`${msg.action}/${msg.id}`)
        if (msg.error) {
            request.resolve(Err(msg.error))
        } else {
            request.resolve(Ok(restoreTransferredValue(msg.data)))
        }
    }

    private _handleNofitication(msg: WorkerNotificationMessage<keyof Notifications>) {
        console.debug("[UI]: received notification", msg)
        this._events[msg.action]?.forEach((handler) => {
            queueTask(() => handler(restoreTransferredValue(msg.data as never)))
        })
    }

    private _listenForVisibiltyChangeEvent() {
        document.addEventListener("visibilitychange", () => {
            if (navigator.onLine) {
                this.sendNotification("ui/visibliyChanged", undefined)
            }
        })
    }
}

type Client<T extends object> = {
    [K in keyof T]: K extends string
        ? T[K] extends (ctx: Context, ...args: any[]) => AsyncResult<any>
            ? T[K]
            : never
        : never
}

function createClient<T extends object>({
    name,
    target,
    requests,
    worker,
}: {
    name: string
    target: T
    requests: Map<string, ReturnType<typeof Promise.withResolvers<any>>>
    worker: WeakRef<Worker>
}): Client<T> {
    let methods = {} as Client<T>
    type Methods = typeof methods
    type MethodKey = keyof Methods

    for (let [prop, descr] of Object.entries(Object.getOwnPropertyDescriptors(target))) {
        if (prop === "constructor") {
            continue
        }

        if (prop.startsWith("_")) {
            continue
        }

        if (typeof descr.value === "function") {
            let key = prop as MethodKey
            let msgType = `${name}/${prop}`
            methods[key] = (async (ctx: Context, ...args: any[]) => {
                let id = nanoid()
                let request = Promise.withResolvers<any>()
                requests.set(`${msgType}/${id}`, request)

                let workerRef = worker.deref()
                if (!workerRef) {
                    request.reject(new Error("worker is not defined"))
                    return
                }

                ctx.signal?.addEventListener(
                    "abort",
                    () => {
                        request.resolve(Err(ctx.signal?.reason))
                    },
                    { once: true },
                )

                if (ctx.signal?.aborted) {
                    return Err(ctx.signal.reason)
                }

                let { prepared, transferables } = prepareForTransfer([ctx, ...args])

                worker.deref()?.postMessage(
                    {
                        type: "request",
                        action: msgType as WorkerRequestMessage["action"],
                        id,
                        params: prepared,
                    } satisfies WorkerRequestMessage,
                    transferables,
                )

                if (ctx.signal?.aborted) {
                    request.resolve(Err(ctx.signal.reason))
                }

                return request.promise
            }) as Methods[typeof key]
        }
    }

    return methods
}

function listenForPerformanceEntries(worker: Worker) {
    worker.addEventListener(
        "message",
        (
            evt: MessageEvent<{
                type: "performance:marks"
                data: PerformanceMark[]
            }>,
        ) => {
            let msg = evt.data
            if (msg.type !== "performance:marks") {
                return
            }
            evt.stopImmediatePropagation()
            for (let entry of msg.data) {
                performance.mark(entry.name, {
                    startTime: entry.startTime,
                    detail: entry.detail,
                })
            }
        },
    )
}
