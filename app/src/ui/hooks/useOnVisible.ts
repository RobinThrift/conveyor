import { Store } from "@tanstack/react-store"
import { type RefObject, startTransition, useEffect, useState } from "react"

let _snapshots = new Store(new WeakMap<Element, IntersectionObserverEntry>())
let _observed = new Store(new WeakSet<Element>())

export function useOnVisible(ref: RefObject<HTMLElement | null>, { ratio }: { ratio: number }) {
    let [isVisible, setIsVisble] = useState<boolean>(() => {
        if (!ref.current) {
            return false
        }
        let snapshot = _snapshots.state.get(ref.current)
        return typeof snapshot !== "undefined" && snapshot.intersectionRatio > ratio
    })

    useEffect(() => {
        if (isVisible) {
            return
        }

        return _subscribe(ref.current, (intersectionRatio) => {
            if (intersectionRatio < ratio) {
                return false
            }

            startTransition(() => setIsVisble(true))

            return true
        })
    }, [ref.current, ratio, isVisible])

    return isVisible
}

let _observer = new IntersectionObserver(
    (entries: IntersectionObserverEntry[]) => {
        for (let entry of entries) {
            _snapshots.setState((s) => {
                s.set(entry.target, entry)
                return s
            })
        }
    },
    {
        threshold: [0.1, 0.5, 1],
        rootMargin: "100px",
    },
)

function _subscribe(
    target: HTMLElement | undefined | null,
    cb: (intersectionRatio: number) => boolean,
) {
    if (!target) {
        return () => {}
    }

    for (let entry of _observer.takeRecords()) {
        if (entry.target === target && cb(entry.intersectionRatio)) {
            return () => {}
        }
    }

    _observer.observe(target)

    _observed.setState((o) => {
        o.add(target)
        return o
    })

    let unsub = _snapshots.subscribe(({ currentVal: s }) => {
        let entry = s.get(target)
        if (!entry) {
            return
        }

        if (!cb(entry.intersectionRatio)) {
            return
        }

        _observer.unobserve(target)

        _observed.setState((o) => {
            o.delete(target)
            return o
        })

        unsub()
    })

    return () => {
        _observer.unobserve(target)
        _observed.setState((o) => {
            o.delete(target)
            return o
        })
        unsub()
    }
}
