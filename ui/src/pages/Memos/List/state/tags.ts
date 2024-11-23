import { list as listTags } from "@/api/tags"
import type { Tag, TagList } from "@/domain/Tag"
import { $baseURL } from "@/hooks/useBaseURL"
import { useStore } from "@nanostores/react"
import { atom, batched, onMount, task } from "nanostores"
import { useMemo } from "react"

const $tagListStoreIsLoading = atom<boolean>(false)
const $tagListStoreNext = atom<string | undefined>()
const $tagListStoreCurrent = atom<string | undefined>()
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
