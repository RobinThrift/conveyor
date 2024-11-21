import type { Memo, MemoID, MemoList } from "@/domain/Memo"
import { format, formatRFC3339, parse } from "date-fns"
import { APIError } from "./APIError"
import type { Pagination } from "./pagination"

export interface Filter {
    tag?: string
    query?: string
    exactDate?: Date
    startDate?: Date
}

export async function list({
    pagination,
    baseURL = "",
    filter,
    signal,
}: {
    pagination: Pagination<Date>
    after?: string
    filter: Filter
    baseURL?: string
    signal?: AbortSignal
}): Promise<MemoList> {
    let url = new URL(`${baseURL}/api/v1/memos`, globalThis.location.href)
    filterToSearchParams(url.searchParams, filter, pagination)

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

    list.next = list.next && new Date(list.next)

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

    let created = await res.json()

    return {
        ...created,
        createdAt: new Date(created.createdAt),
        updatedAt: new Date(created.updatedAt),
    }
}

export interface UpdateMemoRequest {
    id: MemoID
    content?: string
    isArchived?: boolean
}

export async function update({
    memo,
    signal,
    baseURL = "",
}: {
    memo: UpdateMemoRequest
    baseURL?: string
    signal?: AbortSignal
}): Promise<Memo> {
    let url = new URL(
        `${baseURL}/api/v1/memos/${memo.id}`,
        globalThis.location.href,
    )

    let res = await fetch(url, {
        signal,
        method: "PATCH",
        body: JSON.stringify({
            content: memo.content,
            isArchived: memo.isArchived,
        }),
    })

    if (!res.ok) {
        throw new Error(
            `unknown error creating memo: ${res.status} ${res.statusText}`,
        )
    }

    if (res.status !== 204) {
        let err = await APIError.fromHTTPResponse(res)
        throw err.withPrefix("error creating memo")
    }

    return res.json()
}

export interface FilterQuery {
    "filter[tag]"?: string
    "filter[content]"?: string
    "filter[created_at]"?: string
    "op[created_at]"?: string
}

export function filterFromQuery(query: FilterQuery): Filter {
    let filter: Filter = {
        tag: query["filter[tag]"],
        query: query["filter[content]"],
    }

    let createdAt = query["filter[created_at]"]
    if (!createdAt) {
        return filter
    }

    let opCreatedAt = query["op[created_at]"]
    if (opCreatedAt && opCreatedAt == "<=") {
        filter.startDate = parse(createdAt, "yyyy-MM-dd", new Date())
    } else {
        filter.exactDate = parse(createdAt, "yyyy-MM-dd", new Date())
    }

    return filter
}

export function filterToQueryString(filter: Filter): string {
    let query = new URLSearchParams()
    filterToSearchParams(query, filter)
    return query.toString()
}

function filterToSearchParams(
    searchParams: URLSearchParams,
    filter: Filter,
    pagination?: Pagination<Date>,
) {
    if (pagination) {
        searchParams.set("page[size]", `${pagination.pageSize}`)

        if (pagination.after) {
            searchParams.set(
                "page[after]",
                `${formatRFC3339(pagination.after)}`,
            )
        }
    }

    if (filter.tag) {
        searchParams.set("filter[tag]", filter.tag)
    }

    if (filter.query) {
        searchParams.set("filter[content]", filter.query)
    }

    if (filter.exactDate) {
        searchParams.set(
            "filter[created_at]",
            format(filter.exactDate, "yyyy-MM-dd"),
        )
    }

    if (filter.startDate) {
        searchParams.set(
            "filter[created_at]",
            format(filter.startDate, "yyyy-MM-dd"),
        )
        searchParams.set("op[created_at]", "<=")
    }
}
