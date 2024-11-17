import type { CreateMemoRequest } from "@/api/memos"
import { list as listTags } from "@/api/tags"
import type { Memo } from "@/domain/Memo"
import type { Tag, TagList } from "@/domain/Tag"
import { useMemoCreator, useMemoList } from "@/hooks/api/memos"
import { $baseURL } from "@/hooks/useBaseURL"
import { useStore } from "@nanostores/react"
import { atom, batched, onMount, task } from "nanostores"
import { startTransition, useCallback, useMemo, useState } from "react"

const $tagListStoreIsLoading = atom<boolean>(false)
const $tagListStoreNext = atom<Tag | undefined>()
const $tagListStoreCurrent = atom<Tag | undefined>()
const $tagListStoreTags = atom<Tag[]>([])
const $tagListStoreError = atom<Error | undefined>()

const $tagListStore = batched(
    [$tagListStoreTags, $tagListStoreIsLoading, $tagListStoreError],
    (tags, isLoading, error) => {
        return {
            tags,
            isLoading,
            error,
        }
    },
)

const tagListStoreNextPage = () =>
    task(async () => {
        let current = $tagListStoreCurrent.get()
        let next = $tagListStoreNext.get()
        if (typeof next !== "undefined" && next === current) {
            return
        }

        $tagListStoreCurrent.set(next)
        $tagListStoreIsLoading.set(true)

        let abortCtrl = new AbortController()
        let currTags = $tagListStoreTags.get()

        let tags: TagList
        try {
            tags = await listTags({
                pagination: {
                    after: next,
                    pageSize: 20,
                },
                baseURL: $baseURL.get(),
                signal: abortCtrl.signal,
            })
        } catch (err) {
            $tagListStoreIsLoading.set(false)
            $tagListStoreError.set(err as Error)
            return
        }

        $tagListStoreIsLoading.set(false)
        $tagListStoreError.set(undefined)

        $tagListStoreTags.set([...currTags, ...tags.items])

        $tagListStoreNext.set(tags.next)
    })

onMount($tagListStore, () => {
    tagListStoreNextPage()
})

export function useTagListStore() {
    let store = useStore($tagListStore)

    return useMemo(
        () => ({
            ...store,
            nextPage: tagListStoreNextPage,
        }),
        [store],
    )
}

export interface ListMemosPageState {
    memos: {
        memos: Memo[]
        isLoading: boolean
        error?: Error
        nextPage: () => void
        reset: () => void
    }

    creating: {
        created?: Memo
        inProgress: boolean
        error?: Error
    }

    filter: Filter

    setFilter: (f: Filter) => void

    createMemo: (memo: CreateMemoRequest) => void
}

export interface Filter {
    tag?: string
    query?: string
    exactDate?: Date
    startDate?: Date
}

export function useListMemosPageState(init: {
    filter: Filter
}): ListMemosPageState {
    let [filter, setFilter] = useState<Filter>(init.filter)
    let memos = useMemoList({
        pagination: {
            pageSize: 10,
        },
        filter,
    })

    let memoCreator = useMemoCreator()

    return {
        memos: {
            ...memos,
            reset: useCallback(() => {
                startTransition(() => {
                    setFilter({})
                    memos.reset(true)
                })
            }, [memos.reset]),
        },
        creating: {
            created: memoCreator.created,
            inProgress: memoCreator.isLoading,
            error: memoCreator.error,
        },
        filter: filter,
        setFilter,
        createMemo: memoCreator.create,
    }
}
