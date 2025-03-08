import { createContext, useContext } from "react"

import type { AttachmentController } from "@/control/AttachmentController"
import type { Attachment, AttachmentID } from "@/domain/Attachment"
import { BaseContext } from "@/lib/context"
import { type AsyncResult, Err } from "@/lib/result"

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

export function attachmentContextFromController(
    ctrl: AttachmentController,
): AttachmentContext {
    return {
        getAttachmentDataByID: (id) =>
            ctrl.getAttachmentDataByID(BaseContext, id),
    }
}
