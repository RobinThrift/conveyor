const encoder = new TextEncoder()

export function encodeText(input?: string): Uint8Array {
    return encoder.encode(input)
}

const decoder = new TextDecoder()

export function decodeText(
    input?: AllowSharedBufferSource,
    options?: TextDecodeOptions,
): string {
    return decoder.decode(input, options)
}
