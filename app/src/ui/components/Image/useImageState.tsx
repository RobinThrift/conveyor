import { startTransition, useEffect, useMemo, useState } from "react"

import { imageBlobToSrc, parseAttachmentURL } from "@/domain/Attachment"
import { thumbhashToDataURL } from "@/external/thumbhash"
import { useAttachment } from "@/ui/attachments"

export function useImageState({
    ref,
    ...props
}: {
    ref: React.RefObject<HTMLImageElement | null>
    src: string
    style?: React.CSSProperties
    width?: number
    height?: number
}) {
    let attachment = useMemo(() => parseImgURL(props.src), [props.src])
    let attachmentData = useAttachment({ id: attachment?.attachmentID, ref })
    let hash = attachment?.thumbhash
    let [isLoading, setIsLoading] = useState(true)

    let attachmentURL = useMemo(() => {
        if (!attachmentData || !attachmentData?.data) {
            return undefined
        }

        return attachmentData.data && attachmentData.mime
            ? imageBlobToSrc({ data: attachmentData.data, mime: attachmentData.mime })
            : undefined
    }, [attachmentData])

    let src = attachment ? (attachmentURL ?? hash) : props.src

    useEffect(() => {
        let onload = () => {
            startTransition(() => {
                setIsLoading(
                    typeof attachment !== "undefined" && typeof attachmentURL === "undefined",
                )
            })
        }

        ref.current?.addEventListener("load", onload)

        return () => {
            ref.current?.removeEventListener("load", onload)

            if (src?.startsWith("blob:")) {
                URL.revokeObjectURL(src)
            }
        }
    }, [attachment, attachmentURL, ref.current, src])

    let style = {
        minWidth: hash && !attachmentURL ? "200px" : undefined,
        "--img-original-width": attachment?.width ? `${attachment?.width}px` : undefined,
        "--img-original-height": attachment?.height ? `${attachment?.height}px` : undefined,
        ...(props.style ?? {}),
    }

    return {
        src,
        isLoading,
        style,
        width: attachment?.width,
        height: attachment?.height,
    }
}

function parseImgURL(
    src: string,
): { attachmentID: string; thumbhash?: string; width?: number; height?: number } | undefined {
    let attachment = parseAttachmentURL(src)
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
