import { usePromise } from "@/hooks/usePromise"
import { useStore } from "@nanostores/react"
import { enGB as fallback } from "date-fns/locale"
import type { Locale } from "date-fns/locale"
import { locale } from "../locales"
import { supportedLocales } from "../locales"

const loadedLocales = new Map<string, Promise<Locale>>()

const dateFnsLocales = import.meta.glob<boolean, string, { default: Locale }>(
    "./*-*.ts",
)

export function useLocale(): Locale | undefined {
    let code = useStore(locale)

    let p = usePromise(() => {
        if (!supportedLocales.includes(code)) {
            return Promise.resolve(fallback)
        }

        let loaded = loadedLocales.get(code)
        if (loaded) {
            return loaded
        }

        let l = dateFnsLocales[`./${code}.ts`]().then((m) => m.default)
        loadedLocales.set(code, l)
        return l
    }, [])

    return p.resolved && p.result ? p.result : undefined
}
