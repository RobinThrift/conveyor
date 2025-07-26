import { type DependencyList, useEffect, useState } from "react"

export type UsePromise<T> =
    | { resolved: false }
    | { resolved: true; result: T; error: null }
    | { resolved: true; result: null; error: Error }

export function usePromise<T>(fn: () => Promise<T>, deps: DependencyList = []): UsePromise<T> {
    let [state, setState] = useState<UsePromise<T>>({ resolved: false })

    useEffect(() => {
        setState({
            resolved: false,
        })

        fn()
            .then((result) => {
                setState({
                    resolved: true,
                    error: null,
                    result,
                })
            })
            .catch((err) => {
                setState({
                    resolved: true,
                    result: null,
                    error: err,
                })
            })
        // biome-ignore lint/correctness/useExhaustiveDependencies: this is intentional as it's passed in by the caller
    }, deps)

    return state
}
