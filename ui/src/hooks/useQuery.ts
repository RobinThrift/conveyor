import type { Pagination } from "@/api/pagination"
import { isEqual } from "@/helper"
import { $baseURL } from "@/hooks/useBaseURL"
import { useStore } from "@nanostores/react"
import { atom, batched, onMount, task } from "nanostores"
import { useMemo } from "react"

export type QueryFunc<T, Params extends object, P> = (
    params: Params & { pagination: Pagination<P>; signal?: AbortSignal },
) => Promise<{ items: T[]; next?: P }>

export interface UseQueryOptions {
    fetchOnMount?: boolean
}

export function useQuery<T, Params extends object, P = string>(
    fn: QueryFunc<T, Params, P>,
    initParams: Params,
    opts?: UseQueryOptions,
) {
    /* biome-ignore lint/correctness/useExhaustiveDependencies: this is intentional, the init params and opts will change on every rerender
    but as this is a store, it should not cause the store to be recreated. */
    let { $store, nextPage, setParams } = useMemo(
        () => createUseQuery(fn, initParams, opts),
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

function createUseQuery<T, Params extends object, P = string>(
    fn: QueryFunc<T, Params, P>,
    initParams: Params,
    opts?: UseQueryOptions,
) {
    let $isLoading = atom<boolean>(false)
    let $pageNext = atom<P | undefined>()
    let $pageCurrent = atom<P | undefined>()
    let $params = atom<Params>(initParams)
    let $items = atom<T[]>([])
    let $error = atom<Error | undefined>()

    let nextPage = () => {
        let pageCurrent = $pageCurrent.get()
        let pageNext = $pageNext.get()
        if (typeof pageNext !== "undefined" && pageNext === pageCurrent) {
            return
        }
        $isLoading.set(true)

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
                return
            }

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
        task(async () => {
            let abortCtrl = new AbortController()
            let items = $items.get()
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

            $items.set([...items, ...fetched.items])

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
        nextPage,
        setParams,
    }
}
