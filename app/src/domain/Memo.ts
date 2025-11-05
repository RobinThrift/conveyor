import type { Temporal } from "temporal-polyfill"

import { createErrType } from "@/lib/errors"
import { parseDateISO8601 } from "@/lib/i18n"

export type MemoID = string

export interface Memo {
    id: MemoID
    content: string
    isArchived: boolean
    isDeleted: boolean
    createdAt: Temporal.ZonedDateTime
    updatedAt: Temporal.ZonedDateTime
}

export interface MemoList {
    items: Memo[]
    next?: Temporal.ZonedDateTime
}

export interface ListMemosQuery {
    tag?: string
    query?: string
    exactDate?: Temporal.PlainDate
    startDate?: Temporal.PlainDate
    isArchived?: boolean
    isDeleted?: boolean
}

export const ErrMemoNotFound = createErrType("Memos", "memo not found")

export interface FilterQueryParams {
    "filter[tag]"?: string
    "filter[content]"?: string
    "filter[created_at]"?: string
    "op[created_at]"?: string
    "filter[is_deleted]"?: string
    "filter[is_archived]"?: string
}

export function filterFromSearchParams(query: URLSearchParams): ListMemosQuery {
    let filter: ListMemosQuery = {}

    let tagFilter = query.get("filter[tag]")
    if (tagFilter) {
        filter.tag = tagFilter
    }

    let contentFilter = query.get("filter[content]")
    if (contentFilter) {
        filter.query = contentFilter
    }

    let isDeletedFilter = query.get("filter[is_deleted]") === "true"
    if (isDeletedFilter) {
        filter.isDeleted = true
    }

    let isArchivedFilter = query.get("filter[is_archived]") === "true"
    if (isArchivedFilter) {
        filter.isArchived = true
    }

    try {
        let createdAtFilter = query.get("filter[created_at]")
        if (!createdAtFilter) {
            return filter
        }

        let opCreatedAt = query.get("op[created_at]")
        if (opCreatedAt && opCreatedAt === "<=") {
            filter.startDate = parseDateISO8601(createdAtFilter)
        } else {
            filter.exactDate = parseDateISO8601(createdAtFilter)
        }
    } catch (e) {
        console.error(e)
    }

    return filter
}

export function filterToSearchParams(filter: ListMemosQuery) {
    let searchParams = new URLSearchParams()
    addFilterToSearchParams(searchParams, filter)
    return searchParams
}

function addFilterToSearchParams(searchParams: URLSearchParams, filter: ListMemosQuery) {
    if (filter.tag) {
        searchParams.set("filter[tag]", filter.tag)
    }

    if (filter.query) {
        searchParams.set("filter[content]", filter.query)
    }

    if (filter.exactDate) {
        searchParams.set("filter[created_at]", filter.exactDate.toJSON())
    }

    if (filter.startDate) {
        searchParams.set("filter[created_at]", filter.startDate.toJSON())
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
