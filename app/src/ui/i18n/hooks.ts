import { useContext, useMemo } from "react"

import { type Translation, format } from "@/lib/i18n"

import { i18nContext } from "./context"

export function useT<K extends keyof Translation>(
    component: K,
): Translation[K] {
    let ctx = useContext(i18nContext)
    return useMemo(
        () => ctx.translations[component],
        [component, ctx.translations],
    )
}

export function useFormat() {
    let ctx = useContext(i18nContext)
    return useMemo(
        () => format(ctx.region, ctx.datetime),
        [ctx.region, ctx.datetime],
    )
}

export function useDateTimeLocale() {
    let ctx = useContext(i18nContext)
    return ctx.datetime
}
