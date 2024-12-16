import { useSetPage } from "@/state/router"
import React, { useEffect } from "react"

export function Router(props: React.PropsWithChildren) {
    let setPage = useSetPage()

    useEffect(() => {
        let onPopState = (e: PopStateEvent) => {
            if (!e.hasUAVisualTransition && "startViewTransition" in document) {
                document.startViewTransition(() => {
                    setPage(location.href)
                })
            } else {
                setPage(location.href)
            }
        }

        window.addEventListener("popstate", onPopState)

        return () => window.removeEventListener("popstate", onPopState)
    }, [setPage])

    return props.children
}
