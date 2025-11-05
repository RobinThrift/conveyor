import type { Temporal } from "temporal-polyfill"

import { encodeToBase64 } from "@/lib/base64"

export type AttachmentID = string

export interface Attachment {
    id: AttachmentID

    filepath: string
    originalFilename: string
    contentType: string
    sizeBytes: number
    sha256: Uint8Array<ArrayBuffer>
    createdAt: Temporal.ZonedDateTime
}

export interface AttachmentList {
    Items: Attachment[]
    next?: string
}

export const ATTACHMENT_BASE_DIR = "attachments"

export function parseAttachmentURL(
    src: string,
):
    | { attachmentID: string; thumbhash?: string | null; width?: number; height?: number }
    | undefined {
    let u: URL
    try {
        u = new URL(src)
    } catch {
        return
    }

    if (u.protocol !== "attachment:") {
        return
    }

    let width = u.searchParams.get("width")
    let height = u.searchParams.get("height")

    return {
        attachmentID: u.hostname || u.pathname,
        thumbhash: u.searchParams.get("thumbhash"),
        width: width ? Number.parseInt(width, 10) : undefined,
        height: height ? Number.parseInt(height, 10) : undefined,
    }
}

export function imageBlobToSrc({
    data,
    mime,
}: {
    data: Uint8Array<ArrayBuffer>
    mime: string
}): string {
    if (mime === "image/svg+xml") {
        return `data:image/svg+xml;charset=utf-8;base64,${encodeToBase64(data)}`
    }

    return URL.createObjectURL(new Blob([data]))
}
