import type { Components, ComponentsJSON, Translations } from "@nanostores/i18n"
import { translations as base } from "./en"

export type ComponentsDefinition<C extends Components> = Record<
    keyof C,
    TranslationDefinition<C[keyof C]>
>

export type TransformFunc = (code: string, input: string, args: any) => string

export interface Transform {
    transform: TransformFunc
    input: string
}

export type TranslationDefinition<T extends Translations> = Record<
    keyof T,
    string | Transform
>

type TranslationKey<T extends Translation, K extends keyof T> = K

export const translationFiles = import.meta.glob<
    boolean,
    string,
    { default: ComponentsJSON }
>("../../../translations/*.json")

export type Translation = typeof base

export const fallback = resolveTranslation("en", translationToJSON(base))

export async function loadTranslation(
    code: string,
): Promise<ComponentsJSON | undefined> {
    let [lang, _] = code.split("-")

    let load =
        translationFiles[`../../../translations/${code}.json`] ||
        translationFiles[`../../../translations/${lang}.json`]
    if (!load) {
        return
    }

    let mod = await load()
    return mod.default
}

export function resolveTranslation<T extends Translation>(
    locale: string,
    translations: ComponentsJSON,
    definition: ComponentsDefinition<T> = base as any,
): T {
    let resolved = {} as Partial<T>

    for (let componentName in definition) {
        let component = definition[componentName]
        let compTranslated = translations[componentName]
        let r = {} as Partial<T[typeof componentName]>
        let tcomp = componentName as TranslationKey<T, typeof componentName>

        for (let key in component) {
            let tkey = key as keyof T[typeof tcomp]

            let msg = component[key]
            let msgTranslated = compTranslated[key]
            if (typeof msg === "string") {
                r[tkey] = msgTranslated as T[typeof tcomp][typeof tkey]
            } else {
                r[tkey] = ((...args: any[]) =>
                    msg.transform(
                        locale,
                        msgTranslated as string,
                        args,
                    )) as T[typeof tcomp][typeof tkey]
            }
        }

        resolved[componentName] = r as any
    }

    return resolved as T
}

export function translationToJSON<T extends Translation>(
    t: ComponentsDefinition<T>,
): ComponentsJSON {
    let comps: ComponentsJSON = {}

    for (let componentName in t) {
        comps[componentName] = {}
        let comp = t[componentName]
        for (let key in comp) {
            let msg = t[componentName][key]
            if (typeof msg === "string") {
                comps[componentName][key] = msg
            } else {
                comps[componentName][key] = msg.input
            }
        }
    }

    return comps
}
