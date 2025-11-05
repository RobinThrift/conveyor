import { useContext, useMemo } from "react"

import { currentDate, format, getFixedRegion, type Translation } from "@/lib/i18n"

import { i18nContext } from "./context"

export function useT<K extends keyof Translation>(component: K): Translation[K] {
    let ctx = useContext(i18nContext)
    return useMemo(() => ctx.translations[component], [component, ctx.translations])
}

export function useFormat() {
    let ctx = useContext(i18nContext)
    return useMemo(() => format(ctx.region), [ctx.region])
}

export function useWeekInfo() {
    let ctx = useContext(i18nContext)
    return useMemo(() => {
        let code = getFixedRegion(ctx.region)
        let locale = new Intl.Locale(ctx.region)
        let weekInfo: { firstDay: number } =
            "getWeekInfo" in locale && typeof locale.getWeekInfo === "function"
                ? locale.getWeekInfo()
                : { firstDay: 1 }

        let weekStart = findStartOfWeek(weekInfo.firstDay)
        let weekdays = []
        for (let i = 0; i < 7; i++) {
            let day = weekStart.add({ days: i })
            weekdays.push(
                day.toLocaleString(code, {
                    weekday: "long",
                }),
            )
        }

        return {
            firstDayOfWeek: weekInfo.firstDay,
            weekdays,
        }
    }, [ctx.region])
}

function findStartOfWeek(firstDayOfWeek: number) {
    let curr = currentDate()
    if (curr.dayOfWeek === firstDayOfWeek) {
        return curr
    }

    return currentDate().add({ days: firstDayOfWeek - curr.dayOfWeek })
}
