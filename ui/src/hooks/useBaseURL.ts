export const baseURL =
    globalThis.document
        ?.querySelector("meta[name=base-url]")
        ?.getAttribute("content")
        ?.replace(/\/$/, "") ?? ""

export function useBaseURL(): string {
    return baseURL
}
