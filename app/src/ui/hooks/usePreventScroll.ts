import { useEffect } from "react"

export function usePreventScroll({ isDisabled }: { isDisabled?: boolean } = {}) {
    useEffect(() => {
        if (isDisabled) {
            return
        }

        let scrollingElement: HTMLElement | undefined

        document.documentElement.style.overflow = "hidden"
        document.documentElement.style.overscrollBehavior = "contain"

        let ontouchstart = (e: TouchEvent) => {
            scrollingElement = getNearestScrolableParent(e.target as HTMLElement)
        }

        let ontouchmove = (e: TouchEvent) => {
            if (scrollingElement === document.documentElement) {
                e.preventDefault()
                e.stopImmediatePropagation()
                return false
            }
        }

        let ontouchend = () => {
            scrollingElement = undefined
        }

        document.addEventListener("touchstart", ontouchstart, {
            passive: false,
            capture: true,
        })

        document.addEventListener("touchmove", ontouchmove, {
            passive: false,
            capture: true,
        })

        document.addEventListener("touchend", ontouchend, {
            passive: false,
            capture: true,
        })

        return () => {
            document.documentElement.style.overflow = "auto"
            document.documentElement.style.overscrollBehavior = "auto"
            document.removeEventListener("touchstart", ontouchmove, {
                capture: true,
            })
            document.removeEventListener("touchmove", ontouchmove, {
                capture: true,
            })
            document.removeEventListener("touchend", ontouchend, {
                capture: true,
            })
        }
    }, [isDisabled])
}

function getNearestScrolableParent(node: HTMLElement): HTMLElement {
    let scrollableNode: HTMLElement | null = node
    if (isScrollable(scrollableNode)) {
        scrollableNode = scrollableNode.parentElement
    }

    while (scrollableNode && !isScrollable(scrollableNode)) {
        scrollableNode = scrollableNode.parentElement
    }

    return scrollableNode || (document.scrollingElement as HTMLElement) || document.documentElement
}

function isScrollable(node: HTMLElement): boolean {
    let isScrollable = window.getComputedStyle(node).overflow.includes("auto")
    return (
        isScrollable &&
        (node.scrollHeight !== node.clientHeight || node.scrollWidth !== node.clientWidth)
    )
}
