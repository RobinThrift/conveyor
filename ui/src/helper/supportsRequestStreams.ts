export const supportsRequestStreams = (() => {
    let duplexAccessed = false

    const hasContentType = new Request("", {
        body: new ReadableStream(),
        method: "POST",
        // @ts-expect-error: not supported in every browser yet
        get duplex() {
            duplexAccessed = true
            return "half"
        },
    }).headers.has("Content-Type")

    return duplexAccessed && !hasContentType
})()
