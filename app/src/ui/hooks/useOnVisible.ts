import { type RefObject, startTransition, useEffect, useState, useSyncExternalStore } from "react"

export function useOnVisible(ref: RefObject<HTMLElement | null>, { ratio }: { ratio: number }) {
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

    let entries = useSyncExternalStore(subscribe, getSnapshot)

    let [isVisible, setIsVisble] = useState(false)

    if (!isVisible) {
        if (entries.find((e) => e.intersectionRatio > ratio)) {
            startTransition(() => {
                setIsVisble(true)
            })
            if (ref.current) {
                _observer.unobserve(ref.current)
                _snapshots.delete(ref.current)
            }
        }
    }

    return isVisible
}

let _snapshots = new WeakMap<Element, IntersectionObserverEntry[]>()
let _subscriber = new Set<() => void>()

let _observer = new IntersectionObserver(
    (entries: IntersectionObserverEntry[]) => {
        for (let entry of entries) {
            let _snapshot = _snapshots.get(entry.target) ?? []
            _snapshots.set(entry.target, [..._snapshot, entry])
        }
        _subscriber.values().forEach((cb) => cb())
    },
    {
        threshold: [0.1, 0.5, 1],
        rootMargin: "100px",
    },
)

function _subscribe(target?: HTMLElement | undefined | null) {
    return (callback: () => void) => {
        if (!target) {
            return () => {}
        }

        _subscriber.add(callback)
        _observer.observe(target)
        _snapshots.set(target, [])

        return () => {
            _subscriber.delete(callback)
            _snapshots.delete(target)
            _observer.unobserve(target)
        }
    }
}

const _emptySnapshot = [] as IntersectionObserverEntry[]

function _getSnapshot(target: HTMLElement | undefined | null) {
    return () => {
        if (!target) {
            return _emptySnapshot
        }

        let _snapshot = _snapshots.get(target)
        if (_snapshot) {
            return _snapshot
        }

        _snapshot = []

        for (let entry of _observer.takeRecords()) {
            if (entry.target === target) {
                _snapshot.push(entry)
            }
        }

        _snapshots.set(target, _snapshot)

        return _snapshot
    }
}
