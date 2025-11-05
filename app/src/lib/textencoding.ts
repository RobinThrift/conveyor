const encoder = new TextEncoder()

export function encodeText(input?: string): Uint8Array<ArrayBuffer> {
    return encoder.encode(input) as Uint8Array<ArrayBuffer>
}

const decoder = new TextDecoder()

export function decodeText(
    input?: AllowSharedBufferSource | Array<number>,
    options?: TextDecodeOptions,
): string {
    let buf: AllowSharedBufferSource | undefined
    if (Array.isArray(input)) {
        buf = new Uint8Array(input)
    } else {
        buf = input
    }

    return decoder.decode(buf, options)
}
