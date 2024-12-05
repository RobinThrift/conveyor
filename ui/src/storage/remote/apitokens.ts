import type { APIToken } from "@/domain/APIToken"
import { randomID } from "@/helper"
import { $baseURL } from "@/hooks/useBaseURL"
import { atom, batched, computed, onMount, task } from "nanostores"
import * as api from "./api/apitokens"

const $tokens = atom<APIToken[]>([])
const $pages = atom<(string | undefined)[]>([])
const $nextPage = atom<string | undefined>()
const $hasPreviousPage = computed($pages, (pages) => pages.length !== 0)
const $hasNextPage = atom<boolean>(false)
const $isLoading = atom<boolean>(true)
const $error = atom<Error | undefined>()
const $lastCreatedValue = atom<string | undefined>()
const $forceReload = atom<string>(randomID())

const pageSize = 10

const $fetched = batched(
    [$nextPage, $forceReload, $baseURL],
    (nextPage, _, baseURL) =>
        task(async () => {
            try {
                return api.list({
                    pagination: {
                        after: nextPage,
                        pageSize,
                    },
                    baseURL: baseURL,
                })
            } catch (err) {
                return { error: err as Error }
            }
        }),
)

onMount($isLoading, () => {
    let cleanup = [
        () => {
            $tokens.set([])
            $pages.set([])
            $nextPage.set(undefined)
            $hasNextPage.set(false)
            $isLoading.set(false)
            $error.set(undefined)
            $lastCreatedValue.set(undefined)
        },

        $forceReload.subscribe(() => {
            $isLoading.set(true)
        }),

        $nextPage.subscribe(() => {
            $isLoading.set(true)
        }),

        $fetched.subscribe((fetched) => {
            if (!fetched) {
                return
            }
            $isLoading.set(false)

            if ("error" in fetched) {
                $error.set(fetched.error)
            } else {
                $hasNextPage.set(
                    typeof fetched.next !== "undefined" &&
                        fetched.next.length !== 0,
                )
                $tokens.set(fetched.items)
                $error.set(undefined)
            }
        }),
    ]

    return () => cleanup.forEach((fn) => fn())
})

function loadNextPage() {
    if (!$hasNextPage.get()) {
        return
    }

    let tokens = $fetched.get()

    $pages.set([...$pages.get(), $nextPage.get()])

    if ("next" in tokens) {
        $nextPage.set(tokens.next)
    } else {
        $nextPage.set(undefined)
    }
}

function loadPrevPage() {
    if (!$hasPreviousPage.get()) {
        return
    }

    let pages = [...$pages.get()]
    let prevPage: string | undefined = undefined

    if (pages.length <= 1) {
        pages = []
    } else {
        prevPage
        let spliced = pages.splice(pages.length - 1, 1)
        prevPage = spliced[0]
    }

    $pages.set(pages)
    $nextPage.set(prevPage)
}

let create = (token: api.CreateAPITokenRequest) => {
    if ($isLoading.get()) {
        return
    }

    $isLoading.set(true)

    task(async () => {
        let abortCtrl = new AbortController()

        let created: { token: string }
        try {
            created = await api.create({
                token,
                baseURL: $baseURL.get(),
                signal: abortCtrl.signal,
            })
        } catch (err) {
            $isLoading.set(true)
            $error.set(err as Error)
            $lastCreatedValue.set(undefined)
            return
        }

        $isLoading.set(false)
        $lastCreatedValue.set(created.token)
        $forceReload.set(randomID())
    })
}

let del = (name: string) => {
    if ($isLoading.get()) {
        return
    }

    $isLoading.set(true)

    task(async () => {
        let abortCtrl = new AbortController()

        try {
            await api.del({
                name,
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
        $forceReload.set(randomID())
    })
}

export const apiTokensStore = {
    $tokens,
    $isLoading,
    $error,
    $lastCreatedValue,
    $hasPreviousPage,
    $hasNextPage,
    loadPrevPage,
    loadNextPage,
    create,
    del,
}
