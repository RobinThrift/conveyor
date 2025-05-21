import { useMemo } from "react"

import { thumbhashToDataURL } from "@/external/thumbhash"
import { useAttachment } from "@/ui/attachments"

export function useImageState({
    ref,
    ...props
}: {
    ref: React.RefObject<HTMLImageElement | null>
    src: string
    alt: string
    onError?: () => void
    style?: React.CSSProperties
}) {
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
