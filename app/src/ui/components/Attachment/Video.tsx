/** biome-ignore-all lint/a11y/useMediaCaption: is provided by the user */
import React, { useMemo } from "react"

import type { AttachmentID } from "@/domain/Attachment"

export function VideoAttachment({
    attachment,
}: {
    attachment: {
        metadata: Record<string, string>
        id: AttachmentID
        isLoading: boolean
        data?: Uint8Array<ArrayBuffer>
        mime?: string
        error?: Error
    }
}) {
    let src = useMemo(() => {
        let data = attachment.data
        if (!data) {
            return
        }
        return URL.createObjectURL(new Blob([data]))
    }, [attachment.data])

    return (
        <video className="attachment-video" controls>
            <source src={src} type={attachment.mime} />
        </video>
    )
}
