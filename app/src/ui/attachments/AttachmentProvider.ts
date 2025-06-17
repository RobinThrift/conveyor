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

const _attachmentCache = {
    data: [] as ArrayBufferLike[],
    nextIndex: 0,
    idIndexMap: new Map<AttachmentID, number>(),
    set(id: AttachmentID, data: ArrayBufferLike) {
        if (_attachmentCache.nextIndex >= 10) {
            _attachmentCache.nextIndex = 0
        }

        let existingID = _attachmentCache.idIndexMap
            .entries()
            .find(([_, value]) => value === _attachmentCache.nextIndex)?.[0]
        if (existingID) {
            _attachmentCache.idIndexMap.delete(existingID)
        }

        _attachmentCache.data[_attachmentCache.nextIndex] = data
        _attachmentCache.idIndexMap.set(id, _attachmentCache.nextIndex)
        _attachmentCache.nextIndex++
    },

    get(id: AttachmentID) {
        let cacheIndex = _attachmentCache.idIndexMap.get(id)
        if (!cacheIndex) {
            return
        }
        return _attachmentCache.data[cacheIndex]
    },
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
    >(() => {
        if (!id) {
            return
        }
        let data = _attachmentCache.get(id)
        if (!data) {
            return
        }

        return {
            id,
            isLoading: false,
            data,
        }
    })
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

                    _attachmentCache.set(id, attachment.data)

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
