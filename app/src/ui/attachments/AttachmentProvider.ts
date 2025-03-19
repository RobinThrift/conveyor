import { createContext, useContext, useEffect, useState } from "react"

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

function useAttachmentProvider() {
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

export function useAttachment({ id }: { id?: AttachmentID }) {
    let attachmentProvider = useAttachmentProvider()
    let [state, setState] = useState<
        | {
              id: AttachmentID
              isLoading: boolean
              data?: ArrayBufferLike
              error?: Error
          }
        | undefined
    >(undefined)

    useEffect(() => {
        if (!id || id === state?.id) {
            return
        }

        setState({
            id,
            isLoading: true,
        })

        attachmentProvider.getAttachmentDataByID(id).then((load) => {
            setState((state) => {
                if (state?.id !== id) {
                    return state
                }

                if (!load.ok) {
                    return { id, error: load.err, isLoading: false }
                }

                return { id, data: load.value.data, isLoading: false }
            })
        })
    }, [id, state?.id, attachmentProvider.getAttachmentDataByID])

    return state
}
