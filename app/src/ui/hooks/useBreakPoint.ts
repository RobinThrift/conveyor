import { useEffect, useState } from "react"

export function useBreakpoint(breakpoint: number) {
    let [hasHitBreakPoint, setHasHitBreakPoint] = useState<boolean>(false)

    useEffect(() => {
        let onChange = () => {
            setHasHitBreakPoint(window.innerWidth < breakpoint)
        }

        let query = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
        query.addEventListener("change", onChange)
        setHasHitBreakPoint(window.innerWidth < breakpoint)

        return () => query.removeEventListener("change", onChange)
    }, [breakpoint])

    return hasHitBreakPoint
}
