import { useContext, useMemo } from "react"

import { format, type Translation } from "@/lib/i18n"

import { i18nContext } from "./context"

export function useT<K extends keyof Translation>(component: K): Translation[K] {
    let ctx = useContext(i18nContext)
    return useMemo(() => ctx.translations[component], [component, ctx.translations])
}

export function useFormat() {
    let ctx = useContext(i18nContext)
    return useMemo(() => format(ctx.region), [ctx.region])
}
