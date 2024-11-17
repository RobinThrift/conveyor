import { uploadAttachment } from "@/api/attachments"
import type { Attachment } from "@/domain/Attachment"
import * as eventbus from "@/eventbus"
import { useStore } from "@nanostores/react"
import { atom, map, onMount } from "nanostores"
import { $baseURL } from "../useBaseURL"

interface UploadAttachmentTask {
    localID: string
    abortCtrl?: AbortController
    isInProgress: boolean
    attachment?: Attachment
    error?: Error
}

const $attachmentUploadTasksStore = map<Record<string, UploadAttachmentTask>>(
    {},
)

function startUpload(req: {
    localID: string
    filename: string
    data: ReadableStream<Uint8Array>
}) {
    if ($attachmentUploadTasksStore.get()[req.localID]) {
        return
    }

    let abortCtrl = new AbortController()
    uploadAttachment({
        filename: req.filename,
        data: req.data,
        baseURL: $baseURL.get(),
        signal: abortCtrl.signal,
    })
        .then((attachment) => {
            $attachmentUploadTasksStore.setKey(req.localID, {
                localID: req.localID,
                abortCtrl: undefined,
                isInProgress: false,
                attachment: attachment,
            })
        })
        .catch((err) => {
            $attachmentUploadTasksStore.setKey(req.localID, {
                localID: req.localID,
                abortCtrl: undefined,
                isInProgress: false,
                error: err,
            })
        })

    $attachmentUploadTasksStore.setKey(req.localID, {
        localID: req.localID,
        abortCtrl,
        isInProgress: true,
    })
}

onMount($attachmentUploadTasksStore, () => {
    let unsub = eventbus.on("attachments:upload:start", (evt) => {
        startUpload(evt)
    })

    return () => {
        unsub()
        Object.values($attachmentUploadTasksStore.get()).forEach((t) =>
            t.abortCtrl?.abort("Upload cancelled"),
        )
        $attachmentUploadTasksStore.set({})
    }
})

let $emitterStore = atom<(() => void) | undefined>(undefined)

onMount($emitterStore, () => {
    let unsub = $attachmentUploadTasksStore.listen((value, _, changed) => {
        if (!changed) {
            return
        }

        let task = value[changed]
        if (!task || task.isInProgress) {
            return
        }

        if (task.error) {
            eventbus.emit("attachments:upload:error", {
                localID: task.localID,
                error: task.error,
            })
            return
        }

        if (task.attachment) {
            eventbus.emit("attachments:upload:done", {
                localID: task.localID,
                attachment: task.attachment,
            })
            return
        }
    })

    return () => {
        unsub()
    }
})

export function useAttachmentUploader() {
    useStore($emitterStore)
}
