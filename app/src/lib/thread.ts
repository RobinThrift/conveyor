export function getThreadName() {
    return self.name || "window"
}

export function isMainThread() {
    return !(typeof WorkerGlobalScope !== "undefined" && globalThis instanceof WorkerGlobalScope)
}

export function getTransferables(value: any): Transferable[] {
    if (Array.isArray(value)) {
        return Array.from(
            value
                .values()
                .filter((v) => {
                    return v instanceof ArrayBuffer || v instanceof Uint8Array
                })
                .map((v) => {
                    if (v instanceof Uint8Array) {
                        return v.buffer
                    }
                    return v
                }),
        )
    }

    if (value instanceof ArrayBuffer) {
        return [value]
    }

    if (value instanceof Uint8Array) {
        return [value.buffer]
    }

    return []
}
