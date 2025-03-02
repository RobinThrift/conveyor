import type { DependencyList } from "react"
import { usePromise } from "./usePromise"

export function useIdleCallback<T>(task: () => T, deps: DependencyList = []) {
    let p = usePromise(
        () =>
            new Promise<T>((resolve, reject) => {
                let t = () => {
                    try {
                        let r = task()
                        resolve(r)
                    } catch (err) {
                        reject(err)
                    }
                }
                if ("requestIdleCallback" in globalThis) {
                    requestIdleCallback(t)
                } else {
                    requestAnimationFrame(t)
                }
            }),
        deps,
    )

    if (p.resolved) {
        return p.result
    }

    return
}
