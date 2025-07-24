import { nanoid } from "nanoid"

import type { APITokenController } from "@/control/APITokenController"
import type { AttachmentController } from "@/control/AttachmentController"
import type { AuthController } from "@/control/AuthController"
import type { ChangelogController } from "@/control/ChangelogController"
import type { CryptoController } from "@/control/CryptoController"
import type { JobController } from "@/control/JobController"
import type { MemoController } from "@/control/MemoController"
import type { SettingsController } from "@/control/SettingsController"
import type { SetupController } from "@/control/SetupController"
import type { SyncController } from "@/control/SyncController"
import type { UnlockController } from "@/control/UnlockController"
import { queueTask } from "@/lib/microtask"
import { Err, type Result } from "@/lib/result"
import { getThreadName } from "@/lib/thread"
import { prepareForTransfer, restoreTransferredValue } from "@/lib/transferable"

import { type API, type ClientNotifications, type Notifications, getMethod } from "./api"
import type {
    Events,
    WorkerNotificationMessage,
    WorkerRequestMessage,
    WorkerResponseMessage,
} from "./types"

export class Backend {
    private _handlers: API
    private _postMessage: typeof globalThis.postMessage

    private _events: Events<ClientNotifications> = {}

    constructor(
        { postMessage }: { postMessage: typeof globalThis.postMessage },
        {
            apiTokenCtrl,
            attachmentCtrl,
            authCtrl,
            changelogCtrl,
            cryptoCtrl,
            jobCtrl,
            memoCtrl,
            settingsCtrl,
            setupCtrl,
            syncCtrl,
            unlockCtrl,
        }: {
            apiTokenCtrl: APITokenController
            attachmentCtrl: AttachmentController
            authCtrl: AuthController
            changelogCtrl: ChangelogController
            cryptoCtrl: CryptoController
            jobCtrl: JobController
            memoCtrl: MemoController
            settingsCtrl: SettingsController
            setupCtrl: SetupController
            syncCtrl: SyncController
            unlockCtrl: UnlockController
        },
    ) {
        this._postMessage = postMessage
        this._handlers = {
            APITokenController: apiTokenCtrl,
            AttachmentController: attachmentCtrl,
            AuthController: authCtrl,
            ChangelogController: changelogCtrl,
            CryptoController: cryptoCtrl,
            JobController: jobCtrl,
            MemoController: memoCtrl,
            SettingsController: settingsCtrl,
            SetupController: setupCtrl,
            SyncController: syncCtrl,
            UnlockController: unlockCtrl,
        }

        settingsCtrl.addEventListener("onSettingChanged", (data) => {
            this.sendNotification("settings/onSettingChanged", data.setting)
        })

        memoCtrl.addEventListener("onMemoCreated", (data) => {
            this.sendNotification("memos/created", data)
        })

        memoCtrl.addEventListener("onMemoChange", (data) => {
            this.sendNotification("memos/updated", data)
        })
    }

    public sendNotification<K extends keyof Notifications>(event: K, data: Notifications[K]) {
        let { prepared, transferables } = prepareForTransfer(data)
        let id = nanoid()

        try {
            this._postMessage(
                {
                    type: "notification",
                    id,
                    action: event,
                    data: prepared,
                } satisfies WorkerNotificationMessage,
                transferables,
            )
        } catch (e) {
            console.error(`error sending notification: ${event}`, data, e)
        }
    }

    public addEventListener<K extends keyof ClientNotifications>(
        event: K,
        cb: (data: ClientNotifications[K]) => void,
    ): () => void {
        if (!this._events[event]) {
            this._events[event] = []
        }
        this._events[event].push(cb)
        return () => {
            if (!this._events[event]) {
                return
            }
            this._events[event] = this._events[event].filter((i) => cb !== i)
        }
    }

    public removeEventListener<K extends keyof ClientNotifications>(
        event: K,
        cb: (data: ClientNotifications[K]) => void,
    ) {
        if (!this._events[event]) {
            return
        }
        this._events[event] = this._events[event].filter((i) => cb !== i)
    }

    public async onMessage(
        evt: MessageEvent<
            | WorkerRequestMessage<`${keyof typeof this._handlers}/${string}`>
            | WorkerNotificationMessage<keyof ClientNotifications>
        >,
    ) {
        let msg = evt.data
        switch (msg?.type) {
            case "notification":
                evt.stopImmediatePropagation()
                this._handleNofitication(msg)
                break
            case "request":
                evt.stopImmediatePropagation()
                this._handleRequest(msg)
                break
            default:
                return
        }
    }

    private async _handleRequest(
        msg: WorkerRequestMessage<`${keyof typeof this._handlers}/${string}`>,
    ) {
        console.debug("[BACKEND]: received request", msg)

        let result: Result<any> = Err(
            new Error(`[${getThreadName()}] unknown action ${msg.action as string}`),
        )

        let { namespace: handlerName, method: methodName } = getMethod(msg.action)
        let handler = this._handlers[handlerName]
        if (handler) {
            let method = handler[methodName]
            result = await (method as any).apply(handler, restoreTransferredValue(msg.params))
        }

        let [value, err] = result

        let { prepared, transferables } = prepareForTransfer(value)

        try {
            this._postMessage(
                {
                    type: "response",
                    id: msg.id,
                    action: msg.action,
                    data: prepared,
                    error: err,
                } satisfies WorkerResponseMessage,
                transferables,
            )
        } catch (e) {
            console.error(err)
            console.error(e)
        }
    }

    private _handleNofitication(msg: WorkerNotificationMessage<keyof ClientNotifications>) {
        console.debug("[BACKEND]: received notification", msg)
        this._events[msg.action]?.forEach((handler) => {
            queueTask(() => handler(restoreTransferredValue(msg.data)))
        })
    }
}
