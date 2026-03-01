import clsx from "clsx"
import React, { Suspense, useMemo, useRef } from "react"

import { parseAttachmentURL } from "@/domain/Attachment"
import { useAttachment } from "@/ui/attachments"
import { Alert } from "@/ui/components/Alert"
import { Loader } from "@/ui/components/Loader"

import { VideoAttachment } from "./Video"

export type AttachmentProps = {
    className?: string
    id?: string
    src: string
    title?: string
}

export const Attachment = React.memo(function Attachment(props: AttachmentProps) {
    let ref = useRef<HTMLDivElement | null>(null)
    let attachment = useAttachmentViewer(ref, props.src)

    let comp = useMemo(() => {
        if (attachment.isLoading) {
            return <Loader />
        }

        if (attachment.error) {
            return <Alert>{attachment.error.toString()}</Alert>
        }

        if (attachment.mime?.startsWith("video")) {
            return <VideoAttachment attachment={attachment} />
        }

        return <AttachmentLink attachment={attachment} title={props.title} />
    }, [attachment, props.title])

    return (
        <div className={clsx("attachment", props.className)} id={props.id} ref={ref}>
            <Suspense fallback={<Loader />}>{comp}</Suspense>
        </div>
    )
})

function AttachmentLink({
    attachment,
    title,
}: {
    attachment: ReturnType<typeof useAttachmentViewer>
    title?: string
}) {
    let href = useMemo(() => {
        let data = attachment.data
        if (!data) {
            return `#${attachment.id}`
        }
        return URL.createObjectURL(new Blob([data]))
    }, [attachment.id, attachment.data])

    return <a href={href}>{title}</a>
}

function useAttachmentViewer(ref: React.RefObject<HTMLElement | null>, src: string) {
    // biome-ignore lint/style/noNonNullAssertion: must be set
    let attachment = parseAttachmentURL(src)!
    let attachmentData = useAttachment({ id: attachment.attachmentID, ref })

    return {
        id: attachment.attachmentID,
        isLoading: true,
        ...(attachmentData ?? {}),
        metadata: attachment?.metadata,
    }
}
