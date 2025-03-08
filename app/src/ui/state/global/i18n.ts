import {
    type DateTimeLocale,
    type Language,
    type Region,
    type Translation,
    fallback,
    fallbackDateTimeLocale,
    loadDateTimeLocale,
    loadTranslation,
    resolveTranslation,
} from "@/lib/i18n"
import type { StartListening } from "@/ui/state/rootStore"
import { type PayloadAction, createSlice } from "@reduxjs/toolkit"
import { useSelector } from "react-redux"
import { slice as settings } from "../settings"

export interface I18nState {
    language: Language
    region: Region

    translations: Translation
    dateFns: DateTimeLocale
}

const initialState: I18nState = {
    language: "en",
    region: "gb",
    translations: fallback,
    dateFns: fallbackDateTimeLocale,
}

export const slice = createSlice({
    name: "i18n",
    reducerPath: "global.i18n",
    initialState,
    reducers: {
        set: (
            state,
            {
                payload,
            }: PayloadAction<{ language?: Language; region?: Region }>,
        ) => ({
            ...state,
            language: payload.language ?? state.language,
            region: payload.region ?? state.region,
        }),
        setTranslations: (
            state,
            {
                payload,
            }: PayloadAction<{
                translations: Translation
                dateFns: DateTimeLocale
            }>,
        ) => ({
            ...state,
            translations: payload.translations,
            dateFns: payload.dateFns,
        }),
    },

    selectors: {
        dateFns: (state) => state.dateFns,
        region: (state) => state.region,
        language: (state) => state.language,
    },
})

export const registerEffects = (startListening: StartListening) => {
    startListening({
        actionCreator: settings.actions.loadDone,
        effect: async ({ payload }, { cancelActiveListeners, dispatch }) => {
            cancelActiveListeners()

            dispatch(
                slice.actions.set({
                    language: payload.locale.language,
                    region: payload.locale.region,
                }),
            )
        },
    })

    startListening({
        actionCreator: settings.actions.set,
        effect: async ({ payload }, { cancelActiveListeners, dispatch }) => {
            cancelActiveListeners()

            switch (payload.key) {
                case "locale":
                    dispatch(
                        slice.actions.set(
                            payload.value as {
                                language?: Language
                                region?: Region
                            },
                        ),
                    )
                    break
                case "locale.region":
                    dispatch(
                        slice.actions.set({ region: payload.value as Region }),
                    )
                    break
                case "locale.language":
                    dispatch(
                        slice.actions.set({
                            language: payload.value as Language,
                        }),
                    )
                    break
            }
        },
    })

    startListening({
        actionCreator: slice.actions.set,
        effect: async (_, { cancelActiveListeners, getState, dispatch }) => {
            cancelActiveListeners()

            let state = {
                language: slice.selectors.language(getState()),
                region: slice.selectors.region(getState()),
                dateFns: slice.selectors.dateFns(getState()),
            }

            let [translationJSON, dateFns] = await Promise.all([
                loadTranslation(`${state.language}-${state.region}`),
                loadDateTimeLocale(state.region),
            ])

            let translations: ReturnType<typeof resolveTranslation> | undefined
            if (translationJSON) {
                translations = resolveTranslation(
                    `${state.language}-${state.region}`,
                    translationJSON,
                )
            }
            dispatch(
                slice.actions.setTranslations({
                    translations: translations ?? fallback,
                    dateFns: dateFns ?? state.dateFns,
                }),
            )
        },
    })
}

export function useRegion() {
    return useSelector(slice.selectors.region)
}
