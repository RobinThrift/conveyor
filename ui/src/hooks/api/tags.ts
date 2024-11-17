import type { Pagination } from "@/api/pagination"
import { list } from "@/api/tags"
import type { Tag } from "@/domain/Tag"
import { useBaseURL } from "@/hooks/useBaseURL"
import { useCallback, useEffect, useState } from "react"
import { useAPIRequest } from "./useAPIRequest"

export interface UseTagList {
    tags: Tag[]
    isLoading: boolean
    error?: Error

    nextPage: () => void
}

export function useTagList(opts: {
    pagination: Pagination<Tag>
}): UseTagList {
    let baseURL = useBaseURL()
    let listTags = useAPIRequest(list)
    let [pageAfter, setPageAfter] = useState<string | undefined>(
        opts.pagination.after,
    )

    useEffect(() => {
        listTags.request({
            pagination: {
                pageSize: opts.pagination.pageSize,
                after: pageAfter,
            },
            baseURL: baseURL,
        })
    }, [opts.pagination, pageAfter, baseURL, listTags.request])

    useEffect(() => {
        setPageAfter(opts.pagination.after)
    }, [opts.pagination.after])

    return {
        tags: listTags.data?.items ?? [],
        isLoading: listTags.isLoading,
        error: listTags.error,

        nextPage: useCallback(() => {
            setPageAfter(listTags.data?.next)
        }, [listTags.data?.next]),
    }
}
