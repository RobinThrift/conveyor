import { type DependencyList, type RefObject, useCallback, useEffect } from "react"

export function useOnIntersection(
    onChange: (isVisible: boolean) => void,
    deps: DependencyList,
    ref: RefObject<HTMLElement | null>,
    options: IntersectionObserverInit & { ratio: number } = { ratio: 0.1 },
) {
    // biome-ignore lint/correctness/useExhaustiveDependencies: this is intentional as it's passed in by the caller
    let onChangeMemoed = useCallback(onChange, deps)

    useEffect(() => {
        if (ref.current) {
            let observer = new IntersectionObserver(
                (entries: IntersectionObserverEntry[]) => {
                    onChangeMemoed((entries[0].intersectionRatio ?? 0) > options.ratio)
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
            }
        }
    }, [
        onChangeMemoed,
        ref.current,
        options.threshold,
        options.root,
        options.rootMargin,
        options.ratio,
    ])

    if (ref.current && visualViewport) {
        let boundingClientRect = ref.current.getBoundingClientRect()
        if (boundingClientRect.top < visualViewport.height) {
            return true
        }
    }
}
