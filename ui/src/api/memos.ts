import type { Memo, MemoID, MemoList } from "@/domain/Memo"
import { APIError } from "./APIError"
import type { Pagination } from "./pagination"

export async function list({
    pagination,
    baseURL = "",
    filter,
    signal,
}: {
    pagination: Pagination<MemoID>
    after?: string
    filter: {
        tag?: string
        query?: string
        exactDate?: Date
        startDate?: Date
    }
    baseURL?: string
    signal?: AbortSignal
}): Promise<MemoList> {
    let url = new URL(`${baseURL}/api/v1/memos`, globalThis.location.href)
    url.searchParams.set("page[size]", `${pagination.pageSize}`)

    if (pagination.after) {
        url.searchParams.set("page[after]", `${pagination.after}`)
    }

    if (filter.tag) {
        url.searchParams.set("filter[tag]", filter.tag)
    }

    if (filter.query) {
        url.searchParams.set("filter[content]", filter.query)
    }

    if (filter.exactDate) {
        url.searchParams.set(
            "filter[created_at]",
            JSON.stringify(filter.exactDate),
        )
    }

    if (filter.startDate) {
        url.searchParams.set(
            "filter[created_at]",
            JSON.stringify(filter.startDate),
        )
        url.searchParams.set("op[created_at]", "<=")
    }

    let res = await fetch(url, { signal })

    if (!res.ok || res.status !== 200) {
        throw new Error(
            `error fetching memo list: ${res.status} ${res.statusText}`,
        )
    }

    let list = (await res.json()) as MemoList

    list.items = list.items.map((memo) => ({
        ...memo,
        createdAt: new Date(memo.createdAt),
        updatedAt: new Date(memo.updatedAt),
    }))

    return list
}

export interface CreateMemoRequest {
    content: string
}

export async function create({
    memo,
    signal,
    baseURL = "",
}: {
    memo: CreateMemoRequest
    baseURL?: string
    signal?: AbortSignal
}): Promise<Memo> {
    let url = new URL(`${baseURL}/api/v1/memos`, globalThis.location.href)

    let res = await fetch(url, {
        signal,
        method: "POST",
        body: JSON.stringify(memo),
    })

    if (!res.ok) {
        throw new Error(
            `unknown error creating memo: ${res.status} ${res.statusText}`,
        )
    }

    if (res.status !== 201) {
        let err = await APIError.fromHTTPResponse(res)
        throw err.withPrefix("error creating memo")
    }

    return res.json()
}
