export function queueTask(fn: () => void) {
    if ("queueMicrotask" in globalThis) {
        globalThis.queueMicrotask(fn)
        return
    }
    setTimeout(fn, 0)
}
