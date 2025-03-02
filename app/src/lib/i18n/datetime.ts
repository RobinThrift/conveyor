export { add, differenceInCalendarDays, roundToNearestMinutes } from "date-fns"

import { enGB } from "date-fns/locale"
import type { Locale } from "date-fns/locale"
import { type Region, supportedRegions } from "./regions"

export type DateTimeLocale = Locale

const datetimeLocales = import.meta.glob<
    boolean,
    Region,
    { default: DateTimeLocale }
>("../../../translations/datetime/*.ts")

export const fallbackDateTimeLocale = enGB

export async function loadDateTimeLocale(
    region: Region,
): Promise<DateTimeLocale> {
    if (!supportedRegions.includes(region)) {
        return Promise.resolve(fallbackDateTimeLocale)
    }

    let mod =
        await datetimeLocales[`../../../translations/datetime/${region}.ts`]()
    return mod.default
}
