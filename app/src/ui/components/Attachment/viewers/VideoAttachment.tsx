/** biome-ignore-all lint/a11y/useMediaCaption: is provided by the user */
import React, { useEffect, useState } from "react"

export function VideoAttachment({
    attachment,
}: {
    attachment: {
        data?: Uint8Array<ArrayBuffer>
        mime?: string
        originalFilename?: string
    }
}) {
    let [src, setSrc] = useState(() => {
        let data = attachment.data
        if (!data) {
            return
        }
        return URL.createObjectURL(new Blob([data]))
    })

    useEffect(() => {
        let data = attachment.data
        if (!data) {
            return
        }

        let objURL = URL.createObjectURL(new Blob([data]))
        setSrc(objURL)

        return () => {
            URL.revokeObjectURL(objURL)
        }
    }, [attachment.data])

    return (
        <video className="attachment-video" controls>
            <source src={src} type={attachment.mime} />
        </video>
    )
}
