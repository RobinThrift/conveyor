import {
    create as apiCreateMemo,
    update as apiUpdateMemo,
    list as listMemos,
} from "@/api/memos"
import type { ListMemosQuery, Memo } from "@/domain/Memo"
import { createMutatorStore } from "@/hooks/useMutator"
import { createPaginatedQueryStore } from "@/hooks/usePaginatedQuery"
import { useStore } from "@nanostores/react"
import { onMount } from "nanostores"
import { useEffect, useMemo } from "react"

export type Filter = ListMemosQuery

export function useListMemosPageState(init: { filter: Filter }) {
    let {
        $memos,
        setFilter,
        nextPage,
        $creator,
        createMemo,
        $updator,
        updateMemo,
        cleanup,
        /* biome-ignore lint/correctness/useExhaustiveDependencies: this is intentional, the init will change on every rerender
    but as this is a store, it should not be recreated. */
    } = useMemo(() => {
        let $memos = createPaginatedQueryStore<Memo, { filter: Filter }, Date>(
            listMemos,
            init,
        )
        let $creator = createMutatorStore(apiCreateMemo)
        let $updator = createMutatorStore(apiUpdateMemo)

        let setFilter = (filter: Filter) => {
            $memos.setParams({ filter })
        }

        let cleanup = onMount($memos.$store, () => {
            return $creator.$store.subscribe((creator) => {
                if (creator.lastResult) {
                    $memos.addItem(creator.lastResult, {
                        prepend: true,
                    })
                }
            })
        })

        return {
            $memos,
            setFilter,
            nextPage: $memos.nextPage,
            createMemo: $creator.exec,
            $creator,
            updateMemo: $updator.exec,
            $updator,
            cleanup,
        }
    }, [])

    let memos = useStore($memos.$store)
    let createMemoInProgress = useStore($creator.$inProgress)
    let updateMemoInProgress = useStore($updator.$inProgress)

    useEffect(() => cleanup, [cleanup])

    return useMemo(
        () => ({
            memos: memos.items,
            isLoading: memos.isLoading,
            filter: memos.params.filter,
            setFilter,
            nextPage,
            createMemo,
            createMemoInProgress,
            updateMemo,
            updateMemoInProgress,
        }),
        [
            memos.items,
            memos.isLoading,
            memos.params.filter,
            setFilter,
            nextPage,
            createMemo,
            createMemoInProgress,
            updateMemo,
            updateMemoInProgress,
        ],
    )
}
