import type { Preview } from "@storybook/react-vite"
import { initialize, mswLoader } from "msw-storybook-addon"
import { useEffect, useState, useTransition } from "react"
import { Temporal } from "temporal-polyfill"
import { fallback, loadTranslation, resolveTranslation } from "../src/lib/i18n"
import { Theme } from "../src/ui/components/Theme"
import { type I18nContext, i18nContext } from "../src/ui/i18n/context"

import { mockAPI } from "./mockapi"

// Initialize MSW
initialize({
    onUnhandledRequest: "bypass",
})

const serverData = {
    buildInfo: {
        version: "storybook",
        commitHash: "0000000000000000000000000000000000000000",
        commitDate: new Date().toString(),
        goVersion: "go1.24.3 darwin/arm64",
    },
}

const preview: Preview = {
    parameters: {
        actions: { argTypesRegex: "^on[A-Z].*" },
        msw: {
            handlers: mockAPI,
        },

        viewport: {
            options: {
                phone: {
                    name: "Phone",
                    styles: {
                        height: "852px",
                        width: "393px",
                    },
                    type: "mobile",
                },
                xs: {
                    name: "Small Window",
                    styles: {
                        width: "768px",
                        height: "900px",
                    },
                    type: "desktop",
                },
                tablet: {
                    name: "Tablet",
                    styles: {
                        height: "1024px",
                        width: "768px",
                    },
                    type: "desktop",
                },
                sm: {
                    name: "Small",
                    styles: {
                        width: "1440px",
                        height: "900px",
                    },
                    type: "desktop",
                },
                md: {
                    name: "Medium",
                    styles: {
                        width: "1680px",
                        height: "1050px",
                    },
                    type: "desktop",
                },
                lg: {
                    name: "Large",
                    styles: {
                        width: "2100px",
                        height: "1280px",
                    },
                    type: "desktop",
                },
            },
        },
    },

    loaders: [mswLoader],

    decorators: [
        (Story, { globals: { themeMode, themeColours, language, region } }) => {
            if (!document.getElementById("__conveyor_ui_data__")) {
                let uiElement = document.createElement("script")
                uiElement.type = "belt_ui/data"
                uiElement.id = "__conveyor_ui_data__"
                uiElement.innerHTML = JSON.stringify(serverData)
                document.body.prepend(uiElement)
            }

            if (!document.querySelector("meta[name=theme-color]")) {
                let metaThemeEl = document.createElement("meta")
                metaThemeEl.name = "theme-color"
                metaThemeEl.content = ""
                document.head.prepend(metaThemeEl)
            }

            let [isPending, startTransition] = useTransition()
            let [i18nCtx, setI18nCtx] = useState<I18nContext>({
                language,
                region,
                translations: fallback,
                timeZone: Temporal.Now.timeZoneId(),
            })

            useEffect(() => {
                if (i18nCtx.language !== language || i18nCtx.region !== region) {
                    startTransition(async () => {
                        let translationJSON = await loadTranslation(`${language}-${region}`)

                        let translations: ReturnType<typeof resolveTranslation> | undefined
                        if (translationJSON) {
                            translations = resolveTranslation(
                                `${language}-${region}`,
                                translationJSON,
                            )
                        }

                        setI18nCtx((i18nCtx) => ({
                            ...i18nCtx,
                            language,
                            region,
                            translations: translations ?? i18nCtx.translations,
                        }))
                    })
                }
            }, [i18nCtx.language, i18nCtx.region, language, region])

            return (
                <i18nContext.Provider value={i18nCtx}>
                    <Theme
                        colourScheme={{
                            light: themeColours,
                            dark: themeColours,
                        }}
                        mode={themeMode}
                    >
                        {!isPending && <Story />}
                    </Theme>
                </i18nContext.Provider>
            )
        },
    ],

    globalTypes: {
        themeColours: {
            description: "Colour Scheme",
            defaultValue: "default",
            toolbar: {
                title: "Default",
                icon: "contrast",
                items: [
                    { value: "default", title: "Default" },
                    { value: "warm", title: "Warm" },
                    { value: "rosepine", title: "Rosé Pine" },
                ],
                dynamicTitle: true,
            },
        },
        themeMode: {
            description: "Mode",
            defaultValue: "auto",
            toolbar: {
                title: "Auto",
                icon: "lightning",
                items: [
                    { value: "auto", title: "Auto" },
                    { value: "dark", title: "Dark" },
                    { value: "light", title: "Light" },
                ],
                dynamicTitle: true,
            },
        },
        language: {
            description: "Language",
            defaultValue: "en",
            toolbar: {
                title: "English",
                items: [
                    { value: "en", title: "English" },
                    { value: "de", title: "Deutsch" },
                ],
                dynamicTitle: true,
            },
        },
        region: {
            description: "Region",
            defaultValue: "gb",
            toolbar: {
                title: "GB",
                items: [
                    { value: "gb", title: "GB" },
                    { value: "us", title: "USA" },
                    { value: "de", title: "Deutschland" },
                ],
                dynamicTitle: true,
            },
        },
    },
}

export default preview
