import { type CreateMemoRequest, create, list } from "@/api/memos"
import type { Pagination } from "@/api/pagination"
import type { Memo, MemoList } from "@/domain/Memo"
import { useBaseURL } from "@/hooks/useBaseURL"
import { useCallback, useEffect, useState } from "react"
import { useAPIRequest } from "./useAPIRequest"

export interface UseMemoList {
    memos: Memo[]
    isLoading: boolean
    error?: Error

    nextPage: () => void
    reset: (reload?: boolean) => void
}

export function useMemoList(opts: {
    pagination: Pagination<Date>
    filter: {
        query?: string
        exactDate?: Date
        startDate?: Date
        tag?: string
    }
}): UseMemoList {
    let baseURL = useBaseURL()
    let listMemos = useAPIRequest(list)
    let [memos, setMemos] = useState<MemoList>({ items: [] })
    let [pageAfter, setPageAfter] = useState<Date | undefined>(
        opts.pagination.after,
    )

    useEffect(() => {
        listMemos.request({
            pagination: {
                pageSize: opts.pagination.pageSize,
                after: pageAfter,
            },
            filter: {
                tag: opts.filter.tag,
                query: opts.filter.query,
                exactDate: opts.filter.exactDate,
                startDate: opts.filter.startDate,
            },

            baseURL: baseURL,
        })
    }, [
        opts.pagination,
        pageAfter,
        opts.filter.tag,
        opts.filter.query,
        opts.filter.exactDate,
        opts.filter.startDate,
        baseURL,
        listMemos.request,
    ])

    // biome-ignore lint/correctness/useExhaustiveDependencies: we want to reset if the dependency change
    useEffect(() => {
        setMemos({ items: [] })
    }, [
        opts.filter.tag,
        opts.filter.query,
        opts.filter.exactDate,
        opts.filter.startDate,
    ])

    useEffect(() => {
        setMemos((memos) => {
            if (listMemos.data) {
                return {
                    items: [...memos.items, ...listMemos.data.items],
                    next: listMemos.data.next,
                }
            }

            return memos
        })
    }, [listMemos.data])

    useEffect(() => {
        setPageAfter(opts.pagination.after)
    }, [opts.pagination.after])

    return {
        memos: memos.items,
        isLoading: listMemos.isLoading,
        error: listMemos.error,

        nextPage: useCallback(() => {
            setPageAfter(listMemos.data?.next)
        }, [listMemos.data?.next]),
        reset: useCallback(
            (reload?: boolean) => {
                setPageAfter(undefined)
                if (reload) {
                    listMemos.reload()
                }
            },
            [listMemos.reload],
        ),
    }
}

export interface UseMemoCreator {
    isLoading: boolean
    error?: Error
    created?: Memo
    create: (memo: CreateMemoRequest) => void
}

export function useMemoCreator(): UseMemoCreator {
    let baseURL = useBaseURL()
    let [reqData, setReqData] = useState<CreateMemoRequest | undefined>(
        undefined,
    )
    let createMemo = useAPIRequest(create)

    useEffect(() => {
        if (!reqData) {
            return
        }

        createMemo.request({
            memo: reqData,
            baseURL,
        })
    }, [reqData, baseURL, createMemo.request])

    return {
        isLoading: createMemo.isLoading,
        error: createMemo.error,
        created: createMemo.data,
        create: useCallback((r: CreateMemoRequest) => setReqData(r), []),
    }
}
