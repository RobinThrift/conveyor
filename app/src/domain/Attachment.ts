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
