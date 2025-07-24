import { useStore } from "@tanstack/react-store"
import { type RefObject, useCallback, useEffect, useRef } from "react"

import type { AttachmentID } from "@/domain/Attachment"
import { type AsyncResult, Err, Ok, type Result } from "@/lib/result"
import { useOnVisible } from "@/ui/hooks/useOnVisible"
import { actions, selectors, stores } from "@/ui/stores"

export function useAttachment({
    id,
    ref,
    loadOnVisible = ref !== undefined,
}: {
    id?: AttachmentID
    loadOnVisible?: boolean
    ref?: RefObject<HTMLElement | null>
}):
    | {
          id: AttachmentID
          isLoading: boolean
          data?: ArrayBufferLike
          error?: Error
      }
    | undefined {
    let status = useStore(stores.attachments.states, selectors.attachments.getAttachmentState(id))
    let isLoading = useStore(
        stores.attachments.states,
        selectors.attachments.isAttachmentLoading(id),
    )
    let data = useStore(stores.attachments.attachments, selectors.attachments.getAttachmentData(id))
    let fbRef = useRef(null)

    let isVisible = useOnVisible(ref || fbRef, {
        ratio: 0.2,
    })

    useEffect(() => {
        if (!id) {
            return
        }

        if (loadOnVisible && !isVisible) {
            return
        }

        if (status?.state) {
            return
        }

        actions.attachments.loadAttachment(id)
    }, [loadOnVisible, isVisible, id, status?.state])

    if (!id) {
        return
    }

    return {
        id,
        isLoading,
        data: data?.data,
        error: status?.state === "error" ? status.error : undefined,
    }
}

export function useAttachmentLoader(): (
    id: AttachmentID,
) => AsyncResult<{ data: ArrayBufferLike }> {
    let getAttachmentDataByID = useCallback(
        (id: AttachmentID): AsyncResult<{ data: ArrayBufferLike }> => {
            let status = selectors.attachments.getAttachmentState(id)(
                stores.attachments.states.state,
            )
            let data = selectors.attachments.getAttachmentData(id)(
                stores.attachments.attachments.state,
            )

            if (status?.state === "error") {
                return Promise.resolve(Err(status.error))
            }

            if (data) {
                return Promise.resolve(Ok(data))
            }

            let promise = Promise.withResolvers<Result<{ data: ArrayBufferLike }>>()

            actions.attachments.loadAttachment(id)

            let unsubStates = stores.attachments.states.subscribe(({ currentVal: states }) => {
                if (states[id]?.state === "done") {
                    unsubStates()
                    return
                }

                if (states[id]?.state === "error") {
                    promise.reject(Err(states[id]?.error))
                    unsubStates()
                }
            })

            let unsubData = stores.attachments.attachments.subscribe(
                ({ currentVal: attachments }) => {
                    let data = attachments[id]
                    if (data) {
                        promise.resolve(Ok(data))
                        unsubData()
                    }
                },
            )

            return promise.promise
        },
        [],
    )

    return getAttachmentDataByID
}
