import { useSelector } from "react-redux"

import { slice as router } from "@/ui/state/global/router"

export function useBaseURL(): string {
    return (
        useSelector(router.selectors.baseURL) ??
        globalThis.document
            ?.querySelector("meta[name=base-url]")
            ?.getAttribute("content")
            ?.replace(/\/$/, "") ??
        ""
    )
}
