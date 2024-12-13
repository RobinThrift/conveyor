import type { Attachment } from "@/domain/Attachment"

export async function uploadAttachment({
    filename,
    data,
    baseURL = "",
    signal,
}: {
    filename: string
    data: ReadableStream<Uint8Array>
    baseURL?: string
    signal?: AbortSignal
}): Promise<Attachment> {
    let url = new URL(`${baseURL}/api/v1/attachments`, globalThis.location.href)

    let { readable, writable } = new TransformStream()
    data.pipeThrough(new CompressionStream("gzip")).pipeTo(writable)

    let body: ReadableStream | Blob = readable

    body = await streamToBlob(readable.getReader())

    let res = await fetch(url, {
        method: "POST",
        signal,
        body: body,
        // @ts-expect-error: not supported in every browser yet
        duplex: "half",
        headers: {
            "X-Filename": filename,
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "gzip",
        },
    })

    if (!res.ok || res.status !== 201) {
        throw new Error(
            `error uploading attachment: ${res.status} ${res.statusText}`,
        )
    }

    let attachment = await res.json()

    return {
        ...attachment,
        createdAt: new Date(attachment.createdAt),
    }
}

async function streamToBlob(
    reader: ReadableStreamDefaultReader,
): Promise<Blob> {
    let chunks: BlobPart[] = []

    return reader.read().then(async function read({
        done,
        value,
    }: ReadableStreamReadResult<Uint8Array>): Promise<Blob> {
        if (done) {
            return new Blob(chunks)
        }

        chunks.push(value)

        return reader.read().then(read)
    })
}
