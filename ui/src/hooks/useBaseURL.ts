import { useStore } from "@nanostores/react"
import { atom } from "nanostores"

export const $baseURL = atom(
    globalThis.document
        ?.querySelector("meta[name=base-url]")
        ?.getAttribute("content")
        ?.replace(/\/$/, "") ?? "",
)

export function useBaseURL(): string {
    return useStore($baseURL)
}
