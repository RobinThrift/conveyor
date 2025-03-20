import { type RefObject, useEffect, useState } from "react"

export function useOnVisible(
    ref: RefObject<HTMLElement | null>,
    options: IntersectionObserverInit & { ratio: number },
) {
    let [isVisible, setIsVisble] = useState(false)

    useEffect(() => {
        if (ref.current) {
            let observer = new IntersectionObserver(
                (entries: IntersectionObserverEntry[]) => {
                    let intersected =
                        (entries[0].intersectionRatio ?? 0) > options.ratio
                    if (intersected) {
                        setIsVisble(intersected)
                        observer.disconnect()
                    }
                },
                {
                    threshold: options.threshold,
                    root: options.root,
                    rootMargin: options.rootMargin,
                },
            )

            observer.observe(ref.current)

            return () => {
                observer.disconnect()
                setIsVisble(false)
            }
        }
    }, [
        ref.current,
        options.threshold,
        options.root,
        options.rootMargin,
        options.ratio,
    ])

    if (!isVisible && ref.current && visualViewport) {
        let boundingClientRect = ref.current.getBoundingClientRect()
        if (boundingClientRect.top < visualViewport.height) {
            return true
        }
    }

    return isVisible
}
