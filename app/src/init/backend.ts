import type { Attachment, AttachmentID } from "@/domain/Attachment"
import { newID } from "@/domain/ID"
import type { AsyncResult, Result } from "@/lib/result"
import { getThreadName } from "@/lib/thread"
import { instrument } from "@/ui/devtools/ReduxDevTools"
import { type RootStore, actions } from "@/ui/state"
import { connectoToWorkerStore } from "@/ui/state/worker"

declare const __ENABLE_DEVTOOLS__: boolean

export async function initBackend() {
    let rootStore: RootStore

    let worker = new Worker(new URL("./backend.worker?worker&url", import.meta.url), {
        type: "module",
        name: `Backend-${newID()}`,
    })

    if (__ENABLE_DEVTOOLS__) {
        listenForPerformanceEntries(worker)
    }

    let onNavigationEvent = bufferNavigationEvents(worker)

    if (__ENABLE_DEVTOOLS__) {
        rootStore = (await connectoToWorkerStore(worker, [instrument])) as RootStore
    } else {
        rootStore = (await connectoToWorkerStore(worker)) as RootStore
    }

    let attachmentLoader = attachmentLoaderFromWorker(worker)

    handleSyncEventTriggers(rootStore)

    return {
        rootStore,
        onNavigationEvent,
        attachmentLoader,
    }
}

function handleSyncEventTriggers(rootStore: RootStore) {
    document.addEventListener("visibilitychange", () => {
        if (navigator.onLine) {
            rootStore.dispatch(actions.sync.syncStart())
        }
    })
}

function bufferNavigationEvents(worker: Worker) {
    let buffered: MessageEvent<{ type: string }>[] = []
    let handler: ((evt: MessageEvent) => void) | undefined

    worker.addEventListener("message", (evt: MessageEvent<{ type: string }>) => {
        if (evt.data.type.startsWith("navigation:")) {
            evt.stopImmediatePropagation()
            if (handler) {
                handler(evt)
            } else {
                buffered.push(evt)
            }
        }
    })

    return (cb: (evt: MessageEvent) => void) => {
        handler = cb
        buffered.forEach((evt) => cb(evt))
        buffered = []
    }
}

function attachmentLoaderFromWorker(worker: Worker) {
    let requests = new Map<
        string,
        ReturnType<
            typeof Promise.withResolvers<
                Result<{
                    attachment: Attachment
                    data: ArrayBufferLike
                }>
            >
        >
    >()

    worker.addEventListener(
        "message",
        (
            evt: MessageEvent<{
                id: string
                type: "attachment:getAttachmentDataByID:response"
                data: Result<{
                    attachment: Attachment
                    data: ArrayBufferLike
                }>
            }>,
        ) => {
            let msg = evt.data
            if (msg?.type !== "attachment:getAttachmentDataByID:response") {
                return
            }

            evt.stopImmediatePropagation()

            performance.mark("attachment:getAttachmentDataByID:end", {
                detail: {
                    thread: getThreadName(),
                },
            })

            let request = requests.get(evt.data.id)
            if (!request) {
                return
            }

            requests.delete(msg.id)
            request.resolve(evt.data.data)
        },
    )

    return {
        getAttachmentDataByID: async (
            attchmentID: AttachmentID,
        ): AsyncResult<{
            attachment: Attachment
            data: ArrayBufferLike
        }> => {
            let id = newID()

            let request =
                Promise.withResolvers<
                    Result<{
                        attachment: Attachment
                        data: ArrayBufferLike
                    }>
                >()
            requests.set(id, request)

            performance.mark("attachment:getAttachmentDataByID:start", {
                detail: {
                    thread: getThreadName(),
                    data: { id: attchmentID },
                },
            })

            worker.postMessage({
                id,
                type: "attachment:getAttachmentDataByID:request",
                data: { id: attchmentID },
            })

            return request.promise
        },
    }
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
