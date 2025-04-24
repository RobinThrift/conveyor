import {
    createContext,
    RefObject,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react"

import type { AttachmentController } from "@/control/AttachmentController"
import type { Attachment, AttachmentID } from "@/domain/Attachment"
import { BaseContext } from "@/lib/context"
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

export function attachmentContextFromController(
    ctrl: AttachmentController,
): AttachmentContext {
    return {
        getAttachmentDataByID: (id) =>
            ctrl.getAttachmentDataByID(BaseContext, id),
    }
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
    }, [
        loadOnVisible,
        isVisible,
        id,
        state?.id,
        attachmentProvider.getAttachmentDataByID,
    ])

    return state
}
