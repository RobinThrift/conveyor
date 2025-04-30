import React, { useMemo, useRef } from "react"
import "react-medium-image-zoom/dist/styles.css"

import { thumbhashToDataURL } from "@/external/thumbhash"
import { useAttachment } from "@/ui/attachments"
import clsx from "clsx"

export interface ImageProps {
    className?: string
    src: string
    alt: string
    onError?: () => void
}

export const Image = React.memo(function Image(props: ImageProps) {
    let ref = useRef<HTMLImageElement | null>(null)
    let attachment = useMemo(() => parseImgURL(props.src), [props.src])
    let attachmentData = useAttachment({ id: attachment?.attachmentID, ref })
    let hash = attachment?.thumbhash

    let attachmentURL = useMemo(() => {
        if (!attachmentData || !attachmentData?.data) {
            return undefined
        }

        return URL.createObjectURL(
            new Blob([new Uint8Array(attachmentData?.data)]),
        )
    }, [attachmentData])

    let src = attachment ? (attachmentURL ?? hash) : props.src

    let isLoading =
        typeof attachment !== "undefined" &&
        typeof attachmentURL === "undefined"

    return (
        <img
            ref={ref}
            src={src}
            alt={props.alt}
            loading="lazy"
            onError={props.onError}
            className={clsx(
                {
                    "animate-pulse": isLoading,
                },
                props.className,
            )}
            style={{
                minWidth: hash && !attachmentURL ? "200px" : undefined,
            }}
        />
    )
})

function parseImgURL(
    src: string,
): { attachmentID: string; thumbhash?: string } | undefined {
    let u: URL
    try {
        u = new URL(src)
    } catch {
        return
    }

    if (u.protocol !== "attachment:") {
        return
    }

    let th = u.searchParams.get("thumbhash")

    return {
        attachmentID: u.hostname || u.pathname,
        thumbhash: th ? thumbhashToDataURL(th) : undefined,
    }
}
