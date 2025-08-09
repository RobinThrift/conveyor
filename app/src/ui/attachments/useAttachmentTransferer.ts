import { useCallback } from "react"

import type { AttachmentID } from "@/domain/Attachment"
import { queueTask } from "@/lib/microtask"
import { actions, stores } from "@/ui/stores"

export function useAttachmentTransferer() {
    return useCallback(
        async (attachment: {
            id: AttachmentID
            filename: string
            data: Uint8Array
        }): Promise<void> => {
            let { resolve, reject, promise } = Promise.withResolvers<void>()

            let unsub = stores.attachments.states.subscribe(({ currentVal: states }) => {
                let transferState = states[attachment.id]?.state

                if (transferState === "done" || transferState === "error") {
                    unsub()
                }

                queueTask(() => {
                    if (transferState === "done") {
                        resolve()
                        return
                    }

                    if (transferState === "error") {
                        reject()
                        return
                    }
                })
            })

            actions.attachments.transferAttachment(attachment)

            return promise
        },
        [],
    )
}
