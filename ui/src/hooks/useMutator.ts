import { $baseURL } from "@/hooks/useBaseURL"
import { useStore } from "@nanostores/react"
import { atom, batched, task } from "nanostores"
import { useMemo } from "react"

export type MutatorFunc<R, D> = (
    req: R & { signal?: AbortSignal },
) => Promise<D>

export function useMutator<R, D>(fn: MutatorFunc<R, D>) {
    let { $store, exec } = useMemo(() => createMutatorStore(fn), [fn])
    let store = useStore($store)
    return useMemo(
        () => ({
            ...store,
            exec,
        }),
        [store, exec],
    )
}

export function createMutatorStore<R, D>(fn: MutatorFunc<R, D>) {
    let $inProgress = atom<boolean>(false)
    let $lastResult = atom<D | undefined>()
    let $error = atom<Error | undefined>()

    let exec = (req: R) => {
        if ($inProgress.get()) {
            return
        }

        $inProgress.set(true)

        task(async () => {
            let abortCtrl = new AbortController()

            let result: D
            try {
                result = await fn({
                    ...req,
                    baseURL: $baseURL.get(),
                    signal: abortCtrl.signal,
                })
            } catch (err) {
                $lastResult.set(undefined)
                $inProgress.set(false)
                $error.set(err as Error)
                return
            }

            $lastResult.set(result)
            $inProgress.set(false)
            $error.set(undefined)
        })
    }

    let $store = batched(
        [$lastResult, $inProgress, $error],
        (lastResult, inProgress, error) => {
            return {
                lastResult,
                inProgress,
                error,
            }
        },
    )

    return {
        $store,
        $lastResult,
        $inProgress,
        $error,
        exec,
    }
}
