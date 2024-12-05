import type { Settings } from "@/domain/Settings"
import { $baseURL } from "@/hooks/useBaseURL"
import type { StoreKeys } from "@nanostores/react"
import { atom, deepMap, task } from "nanostores"
import { type UpdateSettingsRequest, update } from "./api/settings"

const $values = deepMap<Settings>({
    locale: {
        language: "en",
        region: "gb",
    },

    theme: {
        colourScheme: "default",
        mode: "auto",
        icon: "default",
    },
    controls: {
        vim: true,
        doubleClickToEdit: true,
    },
})

const $isLoading = atom<boolean>(false)
const $error = atom<Error | undefined>()

// @TODO: Add proper error handling
$error.subscribe((err) => (err ? console.error(err) : undefined))

async function set<K extends StoreKeys<typeof $values>>(
    path: K,
    value: any,
    opts?: { signal?: AbortSignal },
) {
    let [group] = path.split(".")
    let current = $values.get()[group as keyof Settings]

    $values.setKey(path, value)

    $isLoading.set(true)
    await task(async () => {
        try {
            await update({
                settings: { [path]: value } as UpdateSettingsRequest,
                baseURL: $baseURL.get(),
                signal: opts?.signal,
            })
            $error.set(undefined)
        } catch (err) {
            $error.set(err as Error)
            $values.setKey(group as keyof Settings, current)
        }
        $isLoading.set(false)
    })
}

export const settingsStore = {
    $values,
    $isLoading,
    $error,
    init: (s: Settings) => {
        $values.set(s)
    },
    set,
}
