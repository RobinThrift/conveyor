import { format, formatRFC3339, parse } from "date-fns"

import type { Pagination } from "./Pagination"

export type MemoID = string

export interface Memo {
    id: MemoID
    content: string
    isArchived: boolean
    isDeleted: boolean
    createdAt: Date
    updatedAt: Date
}

export interface MemoList {
    items: Memo[]
    next?: Date
}

export interface ListMemosQuery {
    tag?: string
    query?: string
    exactDate?: Date
    startDate?: Date
    isArchived?: boolean
    isDeleted?: boolean
}

export interface FilterQueryParams {
    "filter[tag]"?: string
    "filter[content]"?: string
    "filter[created_at]"?: string
    "op[created_at]"?: string
    "filter[is_deleted]"?: string
    "filter[is_archived]"?: string
}

export function filterFromQuery(query: FilterQueryParams): ListMemosQuery {
    let filter: ListMemosQuery = {}

    if (query["filter[tag]"]) {
        filter.tag = query["filter[tag]"]
    }

    if (query["filter[content]"]) {
        filter.query = query["filter[content]"]
    }

    if (query["filter[is_deleted]"] === "true") {
        filter.isDeleted = true
    }

    if (query["filter[is_archived]"] === "true") {
        filter.isArchived = true
    }

    let createdAt = query["filter[created_at]"]
    if (!createdAt) {
        return filter
    }

    let opCreatedAt = query["op[created_at]"]
    if (opCreatedAt && opCreatedAt === "<=") {
        filter.startDate = parse(createdAt, "yyyy-MM-dd", new Date())
    } else {
        filter.exactDate = parse(createdAt, "yyyy-MM-dd", new Date())
    }

    return filter
}

export function filterToSearchParams(
    filter: ListMemosQuery,
    pagination?: Pagination<Date>,
) {
    let searchParams = new URLSearchParams()
    addFilterToSearchParams(searchParams, filter, pagination)
    return searchParams
}

function addFilterToSearchParams(
    searchParams: URLSearchParams,
    filter: ListMemosQuery,
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

    if (filter.isArchived) {
        searchParams.set("filter[is_archived]", "true")
    }

    if (filter.isDeleted) {
        searchParams.delete("filter[is_archived]")
        searchParams.set("filter[is_deleted]", "true")
    }

    return searchParams
}
