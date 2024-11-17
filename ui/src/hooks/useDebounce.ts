import { useCallback, useEffect, useRef } from "react"

export function useDebounce<T, U extends any[]>(
    fn: (...args: U) => T,
    ms = 500,
): [(...args: U) => T, () => void] {
    let handle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    let debounced = useCallback(
        (...args: any) => {
            if (handle.current) {
                clearTimeout(handle.current)
            }

            handle.current = setTimeout(() => {
                fn(...args)
            }, ms)
        },
        [fn, ms],
    ) as (...args: U) => T

    let clear = useCallback(() => {
        if (handle.current) {
            return clearTimeout(handle.current)
        }
    }, [])

    // biome-ignore lint/correctness/useExhaustiveDependencies: make sure to clear timeout when fn changes
    useEffect(() => {
        if (handle.current) {
            clearTimeout(handle.current)
        }
    }, [debounced])

    // on unmount
    useEffect(() => {
        return () => {
            if (handle.current) {
                clearTimeout(handle.current)
            }
        }
    }, [])

    return [debounced, clear]
}
