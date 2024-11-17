import { useCallback, useEffect, useState } from "react"

interface Serializer<T> {
    serializer: (value: T) => string
    deserializer: (value: string) => T
}

type UseLocalStorage<T> = [T | undefined, (value: T | undefined) => void]

export function useLocalStorage<T>(
    key: string,
    initialValue: T | undefined,
    serializer?: Serializer<T>,
): UseLocalStorage<T> {
    let [state, setState] = useState<T | undefined>(() => {
        let localStorageValue = localStorage.getItem(key)
        if (initialValue && localStorageValue === null) {
            localStorage.setItem(
                key,
                serializer?.serializer(initialValue) ?? (initialValue as any),
            )
        }

        if (localStorageValue) {
            return (
                serializer?.deserializer(localStorageValue) ??
                (localStorageValue as T)
            )
        }

        return initialValue
    })

    useEffect(() => {
        let localStorageValue = localStorage.getItem(key)
        if (initialValue && localStorageValue === null) {
            localStorage.setItem(
                key,
                serializer?.serializer(initialValue) ?? (initialValue as any),
            )
        }

        if (localStorageValue) {
            setState(
                serializer?.deserializer(localStorageValue) ??
                    (localStorageValue as T),
            )
            return
        }

        setState(initialValue)
    }, [key, initialValue, serializer?.serializer, serializer?.deserializer])

    let set = useCallback(
        (value: T | undefined) => {
            setState(value)

            if (value) {
                localStorage.setItem(
                    key,
                    serializer?.serializer(value) ?? (value as any),
                )
            } else {
                localStorage.removeItem(key)
            }
        },
        [serializer?.serializer, key],
    )

    return [state, set]
}
