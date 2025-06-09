export type AttachmentID = string

export interface Attachment {
    id: AttachmentID

    filepath: string
    originalFilename: string
    contentType: string
    sizeBytes: number
    sha256: Uint8Array<ArrayBufferLike>
    createdAt: Date
}

export interface AttachmentList {
    Items: Attachment[]
    next?: string
}

export const ATTACHMENT_BASE_DIR = "attachments"

export function attachmentIDFromURL(
    src: string,
): { attachmentID: string; thumbhash?: string | null } | undefined {
    let u: URL
    try {
        u = new URL(src)
    } catch {
        return
    }

    if (u.protocol !== "attachment:") {
        return
    }

    return {
        attachmentID: u.hostname || u.pathname,
        thumbhash: u.searchParams.get("thumbhash"),
    }
}
