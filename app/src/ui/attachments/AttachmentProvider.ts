import {
    type RefObject,
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react"

import type { Attachment, AttachmentID } from "@/domain/Attachment"
import { type AsyncResult, Err } from "@/lib/result"
import { useOnVisible } from "../hooks/useOnVisible"

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

export function useAttachment({
    id,
    ref,
    loadOnVisible = ref !== undefined,
}: {
    id?: AttachmentID
    loadOnVisible?: boolean
    ref?: RefObject<HTMLElement | null>
}) {
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
    let fbRef = useRef(null)

    let isVisible = useOnVisible(ref || fbRef, {
        ratio: 0.2,
    })

    useEffect(() => {
        if (loadOnVisible && !isVisible) {
            return
        }

        if (!id || id === state?.id) {
            return
        }

        setState({
            id,
            isLoading: true,
        })

        attachmentProvider
            .getAttachmentDataByID(id)
            .then(([attachment, err]) => {
                setState((state) => {
                    if (state?.id !== id) {
                        return state
                    }

                    if (err) {
                        return { id, error: err, isLoading: false }
                    }

                    return { id, data: attachment.data, isLoading: false }
                })
            })
    }, [
        loadOnVisible,
        isVisible,
        id,
        state?.id,
        attachmentProvider.getAttachmentDataByID,
    ])

    return state
}

export function useAttachmentLoader() {
    let attachmentProvider = useAttachmentProvider()
    return attachmentProvider.getAttachmentDataByID
}
