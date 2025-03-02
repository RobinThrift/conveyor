import { createContext, useContext } from "react"

import type { Attachment, AttachmentID } from "@/domain/Attachment"
import { BaseContext } from "@/lib/context"
import { type AsyncResult, Err } from "@/lib/result"
import type { AttachmentStorage } from "@/storage/attachments"

export interface AttachmentContext {
    getAttachmentDataByID(
        id: AttachmentID,
    ): AsyncResult<{ attachment: Attachment; data: ArrayBufferLike }>
}

const attachmentContext = createContext<AttachmentContext>({
    getAttachmentDataByID() {
        return Promise.reject(Err(new Error("no attachment provider set")))
    },
})

export const AttachmentProvider = attachmentContext.Provider

export function useAttachmentProvider() {
    return useContext(attachmentContext)
}

export function attachmentContextFromStorage(
    storage: AttachmentStorage,
): AttachmentContext {
    return {
        getAttachmentDataByID: (id) =>
            storage.getAttachmentDataByID(
                BaseContext.withData("db", undefined),
                id,
            ),
    }
}
