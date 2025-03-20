import React, { useMemo } from "react"
import Zoom from "react-medium-image-zoom"
import "react-medium-image-zoom/dist/styles.css"

import { thumbhashToDataURL } from "@/external/thumbhash"
import { useAttachment } from "@/ui/attachments"
import { XIcon } from "@/ui/components/Icons"
import clsx from "clsx"

export interface ImageProps {
    className?: string
    id?: string
    alt: string
    src: string
    caption?: string
}

export function Image(props: ImageProps) {
    let attachment = useMemo(() => parseImgURL(props.src), [props.src])
    let attachmentData = useAttachment({ id: attachment?.attachmentID })
    let hash = attachment?.thumbhash

    let attachmentURL = useMemo(() => {
        if (!attachmentData || !attachmentData?.data) {
            return undefined
        }

        return URL.createObjectURL(
            new Blob([new Uint8Array(attachmentData?.data)]),
        )
    }, [attachmentData])

    let src = attachmentURL ?? hash ?? props.src

    return (
        <figure id={props.id} className={props.className}>
            <Zoom IconUnzoom={() => <XIcon />} classDialog="image-zoom">
                <img
                    src={src}
                    alt={props.alt}
                    loading="lazy"
                    className={clsx({
                        "animate-pulse": !src,
                    })}
                    style={{
                        minWidth: hash && !attachmentURL ? "200px" : undefined,
                    }}
                />
                <figcaption>{props.caption ?? props.alt}</figcaption>
            </Zoom>
        </figure>
    )
}

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
