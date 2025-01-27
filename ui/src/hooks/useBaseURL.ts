import { slice as router } from "@/state/global/router"
import { useSelector } from "react-redux"

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
