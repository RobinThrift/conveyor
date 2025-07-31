import { useEffect, useMemo, useState } from "react"

import { attachmentIDFromURL } from "@/domain/Attachment"
import { thumbhashToDataURL } from "@/external/thumbhash"
import { useAttachment } from "@/ui/attachments"

export function useImageState({
    ref,
    ...props
}: {
    ref: React.RefObject<HTMLImageElement | null>
    src: string
    style?: React.CSSProperties
}) {
    let attachment = useMemo(() => parseImgURL(props.src), [props.src])
    let attachmentData = useAttachment({ id: attachment?.attachmentID, ref })
    let hash = attachment?.thumbhash
    let [isLoading, setIsLoading] = useState(true)

    let attachmentURL = useMemo(() => {
        if (!attachmentData || !attachmentData?.data) {
            return undefined
        }

        return URL.createObjectURL(new Blob([new Uint8Array(attachmentData?.data)]))
    }, [attachmentData])

    let src = attachment ? (attachmentURL ?? hash) : props.src

    useEffect(() => {
        let onload = () => {
            setIsLoading(typeof attachment !== "undefined" && typeof attachmentURL === "undefined")
        }

        ref.current?.addEventListener("load", onload)

        return () => {
            ref.current?.removeEventListener("load", onload)
        }
    })

    let style = {
        minWidth: hash && !attachmentURL ? "200px" : undefined,
        ...(props.style ?? {}),
    }

    return {
        src,
        isLoading,
        style,
    }
}

function parseImgURL(src: string): { attachmentID: string; thumbhash?: string } | undefined {
    let attachment = attachmentIDFromURL(src)
    if (!attachment) {
        return
    }

    let thumbhash: string | undefined
    if (attachment.thumbhash) {
        let [dataURL, thErr] = thumbhashToDataURL(attachment.thumbhash)
        if (thErr) {
            console.error(thErr)
        } else {
            thumbhash = dataURL
        }
    }

    return {
        ...attachment,
        thumbhash,
    }
}
