import { useCallback } from "react"
import { useDispatch, useStore } from "react-redux"

import type { AttachmentID } from "@/domain/Attachment"
import { type RootState, actions, selectors } from "@/ui/state"

export function useAttachmentTransferer() {
    let store = useStore<RootState>()
    let dispatch = useDispatch()

    return useCallback(
        async (attachment: {
            id: AttachmentID
            filename: string
            content: ArrayBufferLike
        }): Promise<void> => {
            let { resolve, reject, promise } = Promise.withResolvers<void>()

            let unsub = store.subscribe(() => {
                let transferState = selectors.attachments.getTransferState(
                    store.getState(),
                    attachment.id,
                )

                if (transferState === "done" || transferState === "error") {
                    unsub()
                }

                requestAnimationFrame(() => {
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

            dispatch(actions.attachments.startTransfer(attachment))

            return promise
        },
        [dispatch, store.subscribe, store.getState],
    )
}
