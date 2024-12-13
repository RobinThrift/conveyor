import { enGB as fallback } from "date-fns/locale"
import type { Locale } from "date-fns/locale"
import { supportedRegions } from "../regions"

const dateFnsLocales = import.meta.glob<
    boolean,
    (typeof supportedRegions)[number],
    { default: Locale }
>("./*.ts")

export { enGB as fallback } from "date-fns/locale"
export type { Locale } from "date-fns/locale"

export async function loadDateFnsLocale(
    region: (typeof supportedRegions)[number],
): Promise<Locale> {
    if (!supportedRegions.includes(region)) {
        return Promise.resolve(fallback)
    }

    let mod = await dateFnsLocales[`./${region}.ts`]()
    return mod.default
}
