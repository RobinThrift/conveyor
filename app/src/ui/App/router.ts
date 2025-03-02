import { history } from "@/external/browser/history"
import { useSetPage } from "@/ui/state/global/router"
import React, { useEffect } from "react"

export function Router(props: React.PropsWithChildren) {
    let setPage = useSetPage()

    useEffect(() => {
        let onPopState = (e: PopStateEvent) => {
            if (!e.hasUAVisualTransition && "startViewTransition" in document) {
                document.startViewTransition(() => {
                    setPage(history.current)
                })
            } else {
                setPage(history.current)
            }
        }

        window.addEventListener("popstate", onPopState)

        return () => window.removeEventListener("popstate", onPopState)
    }, [setPage])

    return props.children
}
