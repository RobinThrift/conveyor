export function getThreadName() {
    return self.name || "window"
}

export function isMainThread() {
    return !(typeof WorkerGlobalScope !== "undefined" && globalThis instanceof WorkerGlobalScope)
}
