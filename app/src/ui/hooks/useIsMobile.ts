import { useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 1024

function getSnapshot() {
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches
}

function subscribe(callback: (matches: boolean) => void) {
    let mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    let onChange = () => {
        callback(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    callback(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
}

export function useIsMobile() {
    return useSyncExternalStore(subscribe, getSnapshot)
}
