import {
    type CreateMemoRequest,
    type UpdateMemoRequest,
    create as createMemo,
    list as listMemos,
    update as updateMemo,
} from "@/api/memos"
import type { ListMemosQuery, Memo, MemoList } from "@/domain/Memo"
import { isEqual } from "@/helper"
import { $baseURL } from "@/hooks/useBaseURL"
import { useStore } from "@nanostores/react"
import { atom, batched, onMount, task } from "nanostores"
import { useEffect, useMemo } from "react"

export type Filter = ListMemosQuery

export type MemoUpdate = UpdateMemoRequest

export interface UseListMemosPageStateInit {
    filter: Filter
    pageSize: number
}

export function useListMemosPageState(init: UseListMemosPageStateInit) {
    /* biome-ignore lint/correctness/useExhaustiveDependencies: this is intentional, the init params and opts will change on every rerender
    but as this is a store, it should not cause the store to be recreated. */
    let { $store, nextPage, setFilter, createMemo, updateMemo } = useMemo(
        () => createListMemosPageStore(init),
        [],
    )
    let store = useStore($store)

    useEffect(() => {
        setFilter(init.filter)
    }, [setFilter, init.filter])

    return useMemo(
        () => ({
            ...store,
            nextPage,
            setFilter,
            createMemo,
            updateMemo,
        }),
        [store, nextPage, setFilter, createMemo, updateMemo],
    )
}

export function createListMemosPageStore(init: UseListMemosPageStateInit) {
    let $isLoading = atom<boolean>(false)
    let $pagination = atom<{
        current?: Date
        next?: Date
        eol: boolean
    }>({ current: undefined, next: undefined, eol: false })
    let $filter = atom<Filter>(init.filter)
    let $memos = atom<Memo[]>([])
    let $error = atom<Error | undefined>()

    let fetchPage = (page: Date | undefined, pageSize: number) => {
        let abortCtrl = new AbortController()
        let filter = $filter.get()

        return listMemos({
            filter: { ...filter },
            pagination: {
                after: page,
                pageSize,
            },
            baseURL: $baseURL.get(),
            signal: abortCtrl.signal,
        })
    }

    let nextPage = () => {
        if ($isLoading.get()) {
            return
        }

        let pagination = $pagination.get()
        if (pagination.eol) {
            return
        }

        $isLoading.set(true)

        task(async () => {
            let memos = $memos.get()

            let fetched: MemoList
            try {
                fetched = await fetchPage(pagination.next, init.pageSize)
            } catch (err) {
                $isLoading.set(false)
                $error.set(err as Error)
                return
            }

            $isLoading.set(false)
            $error.set(undefined)

            $memos.set([...memos, ...fetched.items])

            if (fetched.items.length === 0) {
                $pagination.set({
                    eol: true,
                    current: pagination.current,
                    next: pagination.next,
                })
            } else {
                $pagination.set({
                    eol: false,
                    current: pagination.next,
                    next: fetched.next,
                })
            }
        })
    }

    let setFilter = (params: Filter, force?: boolean) => {
        let currentParmas = $filter.get()
        if (isEqual(params, currentParmas) && !force) {
            return
        }

        $filter.set(params)
        $pagination.set({ current: undefined, next: undefined, eol: false })
        $memos.set([])

        nextPage()
    }

    let create = (memo: CreateMemoRequest) => {
        if ($isLoading.get()) {
            return
        }

        $isLoading.set(true)

        task(async () => {
            let abortCtrl = new AbortController()

            let created: Memo
            try {
                created = await createMemo({
                    memo,
                    baseURL: $baseURL.get(),
                    signal: abortCtrl.signal,
                })
            } catch (err) {
                $isLoading.set(true)
                $error.set(err as Error)
                return
            }

            $memos.set([created, ...$memos.get()])
            $isLoading.set(false)
            $error.set(undefined)
        })
    }

    let update = (memo: MemoUpdate, removeItem: boolean) => {
        if ($isLoading.get()) {
            return
        }

        $isLoading.set(true)

        task(async () => {
            let abortCtrl = new AbortController()

            try {
                await updateMemo({
                    memo,
                    baseURL: $baseURL.get(),
                    signal: abortCtrl.signal,
                })
            } catch (err) {
                $isLoading.set(false)
                $error.set(err as Error)
                return
            }

            $isLoading.set(false)
            $error.set(undefined)

            let items = [...$memos.get()]
            let index = items.findIndex((m) => m.id === memo.id)

            if (index === -1) {
                return
            }

            if (removeItem) {
                items.splice(index, 1)
            } else {
                if (index !== -1) {
                    items[index] = {
                        ...items[index],
                        updatedAt: new Date(),
                        ...memo,
                    }
                }
            }

            $memos.set(items)
        })
    }

    let $store = batched(
        [$memos, $filter, $isLoading, $error],
        (memos, filter, isLoading, error) => {
            return {
                memos,
                isLoading,
                filter,
                error,
            }
        },
    )

    onMount($store, () => {
        nextPage()
    })

    return {
        $store,
        nextPage,
        setFilter,
        createMemo: create,
        updateMemo: update,
    }
}
