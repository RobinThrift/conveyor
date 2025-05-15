export function queueTask(fn: () => void) {
    if ("queueMicrotask" in globalThis) {
        globalThis.queueMicrotask(fn)
    }
    setTimeout(fn, 0)
}
