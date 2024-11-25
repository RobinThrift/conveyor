import { $baseURL } from "@/hooks/useBaseURL"
import { useStore } from "@nanostores/react"
import { atom, batched, onMount, task } from "nanostores"
import { useMemo } from "react"

export type QueryFunc<T, Params extends object> = (
    params: Params & { signal?: AbortSignal },
) => Promise<T>

export interface UseQueryOptions {
    fetchOnMount?: boolean
}

export function useQuery<T, Params extends object>(
    fn: QueryFunc<T, Params>,
    initParams: Params,
    opts?: UseQueryOptions,
) {
    /* biome-ignore lint/correctness/useExhaustiveDependencies: this is intentional, the init params and opts will change on every rerender
    but as this is a store, it should not cause the store to be recreated. */
    let { $store, load } = useMemo(
        () => createQueryStore(fn, initParams, opts),
        [fn],
    )
    let store = useStore($store)
    return useMemo(
        () => ({
            ...store,
            load,
        }),
        [store, load],
    )
}

export function createQueryStore<T, Params extends object>(
    fn: QueryFunc<T, Params>,
    initParams: Params,
    opts?: UseQueryOptions,
) {
    let $isLoading = atom<boolean>(false)
    let $params = atom<Params>(initParams)
    let $value = atom<T | undefined>()
    let $error = atom<Error | undefined>()

    let $store = batched(
        [$value, $params, $isLoading, $error],
        (value, params, isLoading, error) => {
            return {
                value,
                isLoading,
                params,
                error,
            }
        },
    )

    let load = () => {
        $isLoading.set(true)

        task(async () => {
            let abortCtrl = new AbortController()
            let params = $params.get()

            let fetched: T | undefined
            try {
                fetched = await fn({
                    ...params,
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

            $value.set(fetched)
        })
    }

    if (opts?.fetchOnMount) {
        onMount($store, () => {
            load()
        })
    }

    return {
        $store,
        $items: $value,
        $params,
        $isLoading,
        $error,
        load,
    }
}
