import { type RefObject, useEffect, useState, useSyncExternalStore } from "react"

export function useOnResize(ref: RefObject<HTMLElement | null>): {
    clientHeight: number
    scrollHeight: number
} {
    let [subscribe, setSubscribe] = useState<ReturnType<typeof _subscribe>>(() =>
        _subscribe(ref.current),
    )
    let [getSnapshot, setGetSnapshot] = useState<ReturnType<typeof _getSnapshot>>(() =>
        _getSnapshot(ref.current),
    )

    useEffect(() => {
        if (ref.current) {
            setSubscribe(() => _subscribe(ref.current))
            setGetSnapshot(() => _getSnapshot(ref.current))
        }
    }, [ref.current])

    let entry = useSyncExternalStore(subscribe, getSnapshot)
    if (entry) {
        return entry
    }

    return {
        clientHeight: ref.current?.clientHeight ?? 0,
        scrollHeight: ref.current?.scrollHeight ?? 0,
    }
}

let _snapshots = new WeakMap<Element, { clientHeight: number; scrollHeight: number }>()
let _subscriber = new Set<() => void>()

let _observer = new ResizeObserver((entries) => {
    for (let entry of entries) {
        _snapshots.set(entry.target, {
            clientHeight: entry.target.clientHeight,
            scrollHeight: entry.target.scrollHeight,
        })
    }
    _subscriber.values().forEach((cb) => cb())
})

function _subscribe(target?: HTMLElement | undefined | null) {
    return (callback: () => void) => {
        if (!target) {
            return () => {}
        }

        _subscriber.add(callback)
        _observer.observe(target)
        _snapshots.set(target, {
            clientHeight: target.clientHeight ?? 0,
            scrollHeight: target.scrollHeight ?? 0,
        })

        return () => {
            _subscriber.delete(callback)
            _snapshots.delete(target)
            _observer.unobserve(target)
        }
    }
}

function _getSnapshot(target: HTMLElement | undefined | null) {
    return () => {
        if (!target) {
            return undefined
        }

        let _snapshot = _snapshots.get(target)
        if (_snapshot) {
            return _snapshot
        }

        _snapshot = {
            clientHeight: target.clientHeight ?? 0,
            scrollHeight: target.scrollHeight ?? 0,
        }

        _snapshots.set(target, _snapshot)

        return _snapshot
    }
}
