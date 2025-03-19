import React, { useMemo } from "react"
import Zoom from "react-medium-image-zoom"
import "react-medium-image-zoom/dist/styles.css"

import { thumbhashToDataURL } from "@/external/thumbhash"
import { useAttachmentProvider } from "@/ui/attachments"
import { XIcon } from "@/ui/components/Icons"
import { usePromise } from "@/ui/hooks/usePromise"
import clsx from "clsx"

export interface ImageProps {
    className?: string
    id?: string
    alt: string
    src: string
    caption?: string
}

export function Image(props: ImageProps) {
    let attachmentProvider = useAttachmentProvider()
    let attachment = useMemo(() => parseImgURL(props.src), [props.src])
    let hash = attachment?.thumbhash

    let src = usePromise(async () => {
        if (!attachment) {
            return props.src
        }

        let load = await attachmentProvider.getAttachmentDataByID(
            attachment.attachmentID,
        )
        if (!load.ok) {
            console.error(load.err)
            return hash
        }

        return URL.createObjectURL(new Blob([new Uint8Array(load.value.data)]))
    }, [props.src, attachment?.attachmentID, attachmentProvider])

    return (
        <figure id={props.id} className={props.className}>
            <Zoom IconUnzoom={() => <XIcon />} classDialog="image-zoom">
                <img
                    src={src.resolved && !src.error ? src.result : hash}
                    alt={props.alt}
                    loading="lazy"
                    className={clsx({
                        "animate-pulse": !src.resolved,
                    })}
                    style={{
                        minWidth:
                            src.resolved && !src.error ? undefined : "200px",
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
