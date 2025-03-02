export const randomID = (() => {
    if ("randomUUID" in globalThis.crypto) {
        return () => globalThis.crypto.randomUUID()
    }

    if ("getRandomValues" in globalThis.crypto) {
        return () => {
            let a = new Uint32Array(10)
            crypto.getRandomValues(a)
            return a.reduce((p, n) => `${p}${n.toString(16)}`, "")
        }
    }

    return () => `${Math.random()}_${Math.random()}`
})()
