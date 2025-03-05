export function encodeToBase64(data: Uint8Array<ArrayBufferLike>): string {
    if (
        data instanceof Uint8Array &&
        "toBase64" in data &&
        typeof data.toBase64 === "function"
    ) {
        return data.toBase64() as string
    }

    return btoa(String.fromCharCode(...data))
}

export function dataFromBase64(data: string): Uint8Array<ArrayBufferLike> {
    if (
        "fromBase64" in Uint8Array &&
        typeof Uint8Array.fromBase64 === "function"
    ) {
        return Uint8Array.fromBase64(data) as Uint8Array<ArrayBufferLike>
    }

    return new Uint8Array(
        atob(data)
            .split("")
            .map((x) => x.charCodeAt(0)),
    )
}
