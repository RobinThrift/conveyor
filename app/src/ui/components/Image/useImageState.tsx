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
    let hash = attachment?.metadata.thumbhash
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
        "--img-original-width": attachment?.metadata.width
            ? `${attachment?.metadata.width}px`
            : undefined,
        "--img-original-height": attachment?.metadata.height
            ? `${attachment?.metadata.height}px`
            : undefined,
        ...(props.style ?? {}),
    }

    return {
        src,
        isLoading,
        style,
        width: attachment?.metadata.width,
        height: attachment?.metadata.height,
    }
}

type ImgMetadata = { thumbhash?: string; width?: number; height?: number }

function parseImgURL(src: string): { attachmentID: string; metadata: ImgMetadata } | undefined {
    let attachment = parseAttachmentURL(src)
    if (!attachment) {
        return
    }

    let thumbhash: string | undefined
    if (attachment.metadata.thumbhash) {
        let [dataURL, thErr] = thumbhashToDataURL(attachment.metadata.thumbhash)
        if (thErr) {
            console.error(thErr)
        } else {
            thumbhash = dataURL
        }
    }

    return {
        ...attachment,
        metadata: {
            width: attachment.metadata.width
                ? Number.parseInt(attachment.metadata.width, 10)
                : undefined,
            height: attachment.metadata.height
                ? Number.parseInt(attachment.metadata.height, 10)
                : undefined,
            thumbhash: thumbhash ? thumbhash : undefined,
        },
    }
}
