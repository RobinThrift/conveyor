import { isVisibleInViewPort } from "@/lib/dom"
import { type RefObject, startTransition, useEffect, useState } from "react"

export function useOnVisible(
    ref: RefObject<HTMLElement | null>,
    { ratio }: { ratio: number },
) {
    let [isVisible, setIsVisble] = useState(() =>
        isVisibleInViewPort(ref.current),
    )

    useEffect(() => {
        if (ref.current) {
            let observer = new IntersectionObserver(
                (entries: IntersectionObserverEntry[]) => {
                    let intersected =
                        (entries[0].intersectionRatio ?? 0) >= ratio
                    if (intersected) {
                        setIsVisble(intersected)
                        observer.disconnect()
                    }
                },
                {
                    threshold: [0.1, 0.5, 1],
                    rootMargin: "100px",
                },
            )

            observer.observe(ref.current)

            return () => {
                startTransition(() => {
                    setIsVisble(false)
                })
                observer.disconnect()
            }
        }
    }, [ref.current, ratio])

    return isVisible
}
