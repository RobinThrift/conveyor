import type { Pagination } from "@/api/pagination"
import { isEqual } from "@/helper"
import { $baseURL } from "@/hooks/useBaseURL"
import { useStore } from "@nanostores/react"
import { atom, batched, onMount, task } from "nanostores"
import { useMemo } from "react"

export type PaginatedQueryFunc<T, Params extends object, P> = (
    params: Params & { pagination: Pagination<P>; signal?: AbortSignal },
) => Promise<{ items: T[]; next?: P }>

export interface UsePaginatedQueryOptions {
    fetchOnMount?: boolean
}

export function usePaginatedQuery<T, Params extends object, P = string>(
    fn: PaginatedQueryFunc<T, Params, P>,
    initParams: Params,
    opts?: UsePaginatedQueryOptions,
) {
    /* biome-ignore lint/correctness/useExhaustiveDependencies: this is intentional, the init params and opts will change on every rerender
    but as this is a store, it should not cause the store to be recreated. */
    let { $store, nextPage, setParams } = useMemo(
        () => createPaginatedQueryStore(fn, initParams, opts),
        [fn],
    )
    let store = useStore($store)
    return useMemo(
        () => ({
            ...store,
            nextPage,
            setParams,
        }),
        [store, nextPage, setParams],
    )
}

export function createPaginatedQueryStore<T, Params extends object, P = string>(
    fn: PaginatedQueryFunc<T, Params, P>,
    initParams: Params,
    opts?: UsePaginatedQueryOptions,
) {
    let $isLoading = atom<boolean>(false)
    let $pageNext = atom<P | undefined>()
    let $pageCurrent = atom<P | undefined>()
    let $params = atom<Params>(initParams)
    let $items = atom<T[]>([])
    let $error = atom<Error | undefined>()
    let $emptyResponse = atom<boolean>(false)

    let nextPage = () => {
        let pageCurrent = $pageCurrent.get()
        let pageNext = $pageNext.get()
        if (typeof pageNext !== "undefined" && pageNext === pageCurrent) {
            return
        }

        if (
            typeof pageNext === "undefined" &&
            typeof pageNext === "undefined" &&
            $emptyResponse.get()
        ) {
            return
        }

        $isLoading.set(true)
        $emptyResponse.set(false)

        task(async () => {
            let abortCtrl = new AbortController()
            let items = $items.get()
            let params = $params.get()

            let fetched: { items: T[]; next?: P }
            try {
                fetched = await fn({
                    ...params,
                    pagination: {
                        after: pageNext,
                        pageSize: 20,
                    },
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

            $items.set([...items, ...fetched.items])

            $pageCurrent.set(pageNext)

            if (fetched.items.length === 0) {
                $emptyResponse.set(true)
                return
            }

            $emptyResponse.set(false)
            $pageNext.set(fetched.next)
        })
    }

    let setParams = (params: Params, force?: boolean) => {
        let currentParmas = $params.get()
        if (isEqual(params, currentParmas) && !force) {
            return
        }

        $isLoading.set(true)
        $params.set(params)
        $pageCurrent.set(undefined)
        $pageNext.set(undefined)
        task(async () => {
            let abortCtrl = new AbortController()
            let params = $params.get()

            let fetched: { items: T[]; next?: P }
            try {
                fetched = await fn({
                    ...params,
                    pagination: {
                        after: $pageCurrent.get(),
                        pageSize: 20,
                    },
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

            $items.set(fetched.items)
            $pageNext.set(fetched.next)
        })
    }

    let $store = batched(
        [$items, $params, $isLoading, $error],
        (items, params, isLoading, error) => {
            return {
                items,
                isLoading,
                params,
                error,
            }
        },
    )

    if (opts?.fetchOnMount) {
        onMount($store, () => {
            nextPage()
        })
    }

    return {
        $store,
        $items,
        $params,
        $isLoading,
        $error,
        nextPage,
        setParams,
    }
}
