import { usePromise } from "@/hooks/usePromise"
import { useStore } from "@nanostores/react"
import { enGB as fallback } from "date-fns/locale"
import type { Locale } from "date-fns/locale"
import { $region, supportedRegions } from "../regions"

const loadedLocales = new Map<string, Promise<Locale>>()

const dateFnsLocales = import.meta.glob<
    boolean,
    (typeof supportedRegions)[number],
    { default: Locale }
>("./*.ts")

export function useLocale(): Locale | undefined {
    let region = useStore($region) ?? "gb"

    let p = usePromise(() => {
        if (!supportedRegions.includes(region)) {
            return Promise.resolve(fallback)
        }

        let loaded = loadedLocales.get(region)
        if (loaded) {
            return loaded
        }

        let l = dateFnsLocales[`./${region}.ts`]().then((m) => m.default)
        loadedLocales.set(region, l)
        return l
    }, [])

    return p.resolved && p.result ? p.result : undefined
}
