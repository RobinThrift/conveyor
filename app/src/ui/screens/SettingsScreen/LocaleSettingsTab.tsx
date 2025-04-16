import React, { useCallback, useMemo } from "react"

import {
    type Language,
    type Region,
    supportedLanguages,
    supportedRegions,
} from "@/lib/i18n"
import { Select } from "@/ui/components/Select"
import { useT } from "@/ui/i18n"
import { useSetting } from "@/ui/settings"

export function LocaleSettingsTab({
    ref,
}: { ref?: React.Ref<HTMLDivElement> }) {
    let t = useT("screens/Settings/LocaleSettings")

    let [lang, setLang] = useSetting("locale.language")
    let [region, setRegion] = useSetting("locale.region")

    let onChangeLanguage = useCallback(
        (v: Language) => {
            setLang(v)
        },
        [setLang],
    )

    let onChangeRegion = useCallback(
        (v: Region) => {
            setRegion(v)
        },
        [setRegion],
    )

    let languages = useMemo(
        () =>
            supportedLanguages.map((lang) => (
                <Select.Option key={lang} value={lang}>
                    {new Intl.DisplayNames([lang], {
                        type: "language",
                    }).of(lang.toUpperCase())}
                </Select.Option>
            )),
        [],
    )

    let regions = useMemo(
        () =>
            supportedRegions.map((locale) => (
                <Select.Option key={locale} value={locale}>
                    {new Intl.DisplayNames([lang], {
                        type: "region",
                    }).of(locale.toUpperCase())}
                </Select.Option>
            )),
        [lang],
    )

    return (
        <div ref={ref} className="settings-section-content">
            <div className="settings-sub-section">
                <div className="sm:mb-0 md:grid grid-cols-6 space-y-1">
                    <label
                        htmlFor="language"
                        className="flex items-center font-semibold text-sm"
                    >
                        {t.LabelSelectLanguage}
                    </label>
                    <Select
                        className="col-span-5"
                        name="language"
                        onChange={onChangeLanguage}
                        value={lang}
                    >
                        {languages}
                    </Select>
                </div>

                <div className="sm:mb-0 md:grid grid-cols-6 space-y-1">
                    <label
                        htmlFor="region"
                        className="flex items-center font-semibold text-sm"
                    >
                        {t.LabelSelectRegion}
                    </label>
                    <Select
                        className="col-span-5"
                        name="region"
                        onChange={onChangeRegion}
                        value={region}
                    >
                        {regions}
                    </Select>
                </div>
            </div>
        </div>
    )
}
