import type { TagList } from "@/domain/Tag"
import type { Pagination } from "./pagination"

export async function list({
    pagination,
    baseURL = "",
    signal,
}: {
    pagination: Pagination<string>
    after?: string
    baseURL?: string
    signal?: AbortSignal
}): Promise<TagList> {
    let url = new URL(`${baseURL}/api/v1/tags`, globalThis.location.href)
    url.searchParams.set("page[size]", `${pagination.pageSize}`)

    if (pagination.after) {
        url.searchParams.set("page[after]", `${pagination.after}`)
    }

    let res = await fetch(url, { signal })

    if (!res.ok || res.status !== 200) {
        throw new Error(
            `error fetching tag list: ${res.status} ${res.statusText}`,
        )
    }

    return res.json()
}
